import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT access token to outgoing API requests and attempts a
 * single token refresh if a request fails with 401 Unauthorized.
 *
 * Uses a BehaviorSubject queue so that if multiple requests all fail with
 * 401 simultaneously (common when a tab wakes from sleep), only ONE
 * refresh call is made — the rest wait and retry with the new token.
 * Without this, concurrent refreshes race and the user gets logged out.
 */

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  let authReq = req;
  if (accessToken) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh')
        || req.url.includes('/auth/register');

      if (error.status === 401 && accessToken && !isAuthEndpoint) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap(() => {
              isRefreshing = false;
              const newToken = authService.getAccessToken()!;
              refreshSubject.next(newToken);
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              }));
            }),
            catchError(refreshError => {
              isRefreshing = false;
              refreshSubject.next(null);
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          // Another request already triggered a refresh — wait for it.
          return refreshSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => next(req.clone({
              setHeaders: { Authorization: `Bearer ${token}` }
            })))
          );
        }
      }
      return throwError(() => error);
    })
  );
};
