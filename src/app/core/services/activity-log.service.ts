import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';

/** A single user activity event, as recorded by the backend. */
export interface UserActivityLog {
  id: number;
  eventType: 'VISIT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'REGISTER';
  email?: string;
  userId?: number;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  createdAt: string;
}

export interface ActivityLogSummary {
  totalVisits: number;
  visitsLast24h: number;
  loginsLast24h: number;
  failedLoginsLast24h: number;
  registrationsLast24h: number;
}

/**
 * Tracks user flow (page visits, logouts) and exposes the admin-side
 * "User Logs" queries. Logins/failed logins/registrations are recorded
 * server-side automatically - clients cannot spoof them.
 */
@Injectable({ providedIn: 'root' })
export class ActivityLogService {

  constructor(private http: HttpClient) {
  }

  /**
   * Fire-and-forget tracking ping. Works for anonymous visitors too; if the
   * user is logged in the auth interceptor attaches their token so the event
   * is attributed to them. Never surfaces errors to the user.
   */
  track(eventType: 'VISIT' | 'LOGOUT', path?: string): void {
    this.http.post(`${environment.apiUrl}/public/track`, { eventType, path })
      .subscribe({ next: () => {}, error: () => {} });
  }

  /** Admin: paged activity logs, optionally filtered by event type. */
  getLogs(eventType: string | null, page = 0, size = 25): Observable<ApiResponse<PageResponse<UserActivityLog>>> {
    const params: { [key: string]: string | number } = { page, size };
    if (eventType) {
      params['eventType'] = eventType;
    }
    return this.http.get<ApiResponse<PageResponse<UserActivityLog>>>(
      `${environment.apiUrl}/admin/activity-logs`, { params });
  }

  /** Admin: headline counters for the User Logs page. */
  getSummary(): Observable<ApiResponse<ActivityLogSummary>> {
    return this.http.get<ApiResponse<ActivityLogSummary>>(
      `${environment.apiUrl}/admin/activity-logs/summary`);
  }
}
