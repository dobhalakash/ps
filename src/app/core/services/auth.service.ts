import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterBusinessRequest,
  RegisterCustomerRequest,
  UpdateProfileRequest,
  User
} from '../models/user.model';

const ACCESS_TOKEN_KEY = 'th_access_token';
const REFRESH_TOKEN_KEY = 'th_refresh_token';
const USER_KEY = 'th_user';
const LAST_ACTIVITY_KEY = 'th_last_activity';

/** Auto-logout after this much user inactivity (applies across restarts). */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
/** How often the idle watchdog checks for expiry while the app is open. */
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;
/** Throttle for persisting the last-activity timestamp. */
const ACTIVITY_WRITE_THROTTLE_MS = 30 * 1000;

/**
 * Manages authentication state: login, registration, token storage,
 * and the currently authenticated user.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  /** The currently authenticated user, or null if logged out. */
  readonly currentUser = signal<User | null>(this.readStoredUser());

  /** True if a user is currently authenticated. */
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /** Convenience accessor for the current user's role. */
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);

  /** Business and admin accounts can browse the catalog but never buy - they manage a shop, not shop on it. Guests and customers can. */
  readonly canShop = computed(() => {
    const role = this.currentRole();
    return role === null || role === 'CUSTOMER';
  });

  private refreshTimer: any = null;
  private idleTimer: any = null;
  private isRefreshing = false;
  private lastActivityWrite = 0;

  constructor(private http: HttpClient, private router: Router) {
    // SECURITY: never trust the session blindly from localStorage. On every
    // app start we verify (a) the refresh token hasn't expired and (b) the
    // user wasn't idle beyond the timeout — even across a system restart.
    // This fixes "restarted the PC, opened the same URL, still logged in
    // with the backend not even running".
    this.validateStoredSession();

    // Keep the session alive while the user is ACTIVE: refresh the access
    // token well before it expires, and immediately when the user returns
    // to the tab.
    this.startAutoRefresh();
    this.startIdleWatch();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isLoggedIn()) {
        this.checkIdle();           // may end the session if idle too long
        if (this.isLoggedIn()) {
          this.silentRefresh();
        }
      }
    });
  }

  // ── Session validation & idle timeout ──────────────────────────────────

  /** Runs once on startup: drops any stale/expired session before use. */
  private validateStoredSession(): void {
    if (!this.currentUser()) {
      return;
    }
    const refreshToken = this.getRefreshToken();
    if (!refreshToken || this.isTokenExpired(refreshToken)) {
      this.clearSession();
      return;
    }
    const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
    if (last > 0 && Date.now() - last > IDLE_TIMEOUT_MS) {
      this.clearSession();
      return;
    }
    this.touchActivity(true);
  }

  /** Decodes a JWT's exp claim locally — no backend needed. */
  private isTokenExpired(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(payloadPart));
      return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
    } catch {
      return true; // unreadable token = invalid token
    }
  }

  /** Watches user activity; logs out automatically after IDLE_TIMEOUT_MS. */
  private startIdleWatch(): void {
    const events: (keyof DocumentEventMap)[] = ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(ev => document.addEventListener(ev, () => this.touchActivity(), { passive: true }));
    this.idleTimer = setInterval(() => this.checkIdle(), IDLE_CHECK_INTERVAL_MS);
  }

  /** Persists the last-activity timestamp (throttled to limit writes). */
  private touchActivity(force = false): void {
    if (!this.isLoggedIn()) {
      return;
    }
    const now = Date.now();
    if (force || now - this.lastActivityWrite > ACTIVITY_WRITE_THROTTLE_MS) {
      this.lastActivityWrite = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    }
  }

  private checkIdle(): void {
    if (!this.isLoggedIn()) {
      return;
    }
    const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
    if (last > 0 && Date.now() - last > IDLE_TIMEOUT_MS) {
      this.clearSession();
      this.router.navigate(['/login'], { queryParams: { reason: 'session-expired' } });
    }
  }

  /** Wipes the local session WITHOUT calling the backend (used for expiry). */
  private clearSession(): void {
    this.stopAutoRefresh();
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    this.currentUser.set(null);
  }

  /** Proactively refresh token every 45 minutes so it never expires during use. */
  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    if (this.isLoggedIn()) {
      // Refresh every 45 minutes (access token lasts 60 minutes)
      this.refreshTimer = setInterval(() => this.silentRefresh(), 45 * 60 * 1000);
    }
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /** Try to refresh without interrupting the user. If it fails, do nothing — the
   *  401 interceptor will catch it on the next real API call. */
  private silentRefresh(): void {
    if (this.isRefreshing || !this.getRefreshToken()) return;
    this.isRefreshing = true;
    this.refreshToken().subscribe({
      next: () => { this.isRefreshing = false; },
      error: () => { this.isRefreshing = false; }
    });
  }

  registerCustomer(request: RegisterCustomerRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/register/customer`, request)
      .pipe(tap(res => this.handleAuthSuccess(res.data)));
  }

  registerBusiness(request: RegisterBusinessRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/register/business`, request)
      .pipe(tap(res => this.handleAuthSuccess(res.data)));
  }

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, request)
      .pipe(tap(res => this.handleAuthSuccess(res.data)));
  }

  socialLogin(payload: { provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE'; token: string; firstName?: string; lastName?: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/social-login`, payload)
      .pipe(tap(res => this.handleAuthSuccess(res.data)));
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(tap(res => this.handleAuthSuccess(res.data)));
  }

  verifyEmail(email: string, code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/verify-email`, { email, code })
      .pipe(tap(() => this.markVerified('emailVerified')));
  }

  verifyMobile(email: string, code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/verify-mobile`, { email, code })
      .pipe(tap(() => this.markVerified('mobileVerified')));
  }

  resendOtp(email: string, channel: 'EMAIL' | 'MOBILE'): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/resend-otp`, { email, channel });
  }

  private markVerified(field: 'emailVerified' | 'mobileVerified'): void {
    const user = this.currentUser();
    if (user) {
      this.setCurrentUser({ ...user, [field]: true });
    }
  }

  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.usersUrl}/me`, request)
      .pipe(tap(res => this.setCurrentUser(res.data)));
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.usersUrl}/me/password`, request);
  }

  logout(): void {
    // Record the logout in the user activity log (fire-and-forget). Sent
    // before the token is cleared so the event is attributed to the user.
    this.http.post(`${environment.apiUrl}/public/track`, { eventType: 'LOGOUT' })
      .subscribe({ next: () => {}, error: () => {} });

    this.clearSession();
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/reset-password`, { email, otp, newPassword });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private handleAuthSuccess(auth: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    this.setCurrentUser(auth.user);
    this.touchActivity(true);
    this.startAutoRefresh();
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
