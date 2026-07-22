import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { Notification } from '../models/notification.model';

/**
 * Manages the authenticated user's notifications.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  /** Number of unread notifications, used for the navbar badge. */
  readonly unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {
  }

  getNotifications(page = 0, size = 10): Observable<ApiResponse<PageResponse<Notification>>> {
    return this.http.get<ApiResponse<PageResponse<Notification>>>(this.baseUrl, {
      params: { page, size }
    });
  }

  refreshUnreadCount(): void {
    this.http.get<ApiResponse<{ count: number }>>(`${this.baseUrl}/unread-count`)
      .subscribe({
        next: res => this.unreadCount.set(res.data.count),
        error: () => this.unreadCount.set(0)
      });
  }

  markAsRead(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/${id}/read`, {})
      .pipe(tap(() => this.refreshUnreadCount()));
  }

  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/read-all`, {})
      .pipe(tap(() => this.unreadCount.set(0)));
  }

  getAll(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.baseUrl);
  }

  markAllRead(): Observable<any> {
    return this.http.put(this.baseUrl + '/read-all', {});
  }
}
