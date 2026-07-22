import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityLogService, ActivityLogSummary, UserActivityLog } from '../../../core/services/activity-log.service';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

/**
 * Admin "User Logs" screen: the full flow of users through the site -
 * anonymous visitors browsing without logging in, successful logins,
 * failed login attempts, registrations, and logouts.
 */
@Component({
  selector: 'app-admin-user-logs',
  standalone: true,
  imports: [CommonModule, AdminNavComponent],
  templateUrl: './user-logs.component.html',
  styleUrl: './user-logs.component.css'
})
export class AdminUserLogsComponent implements OnInit {

  readonly logs = signal<UserActivityLog[]>([]);
  readonly summary = signal<ActivityLogSummary | null>(null);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly eventType = signal<string | null>(null);

  readonly eventFilters: { label: string; value: string | null }[] = [
    { label: 'All Activity', value: null },
    { label: 'Visits', value: 'VISIT' },
    { label: 'Logins', value: 'LOGIN_SUCCESS' },
    { label: 'Failed Logins', value: 'LOGIN_FAILED' },
    { label: 'Registrations', value: 'REGISTER' },
    { label: 'Logouts', value: 'LOGOUT' }
  ];

  constructor(private activityLogService: ActivityLogService) {
  }

  ngOnInit(): void {
    this.loadSummary();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.activityLogService.getLogs(this.eventType(), this.page(), 25).subscribe({
      next: res => {
        this.logs.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadSummary(): void {
    this.activityLogService.getSummary().subscribe({
      next: res => this.summary.set(res.data),
      error: () => {}
    });
  }

  setFilter(value: string | null): void {
    this.eventType.set(value);
    this.page.set(0);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  refresh(): void {
    this.loadSummary();
    this.load();
  }

  eventLabel(type: string): string {
    switch (type) {
      case 'VISIT': return 'Visit';
      case 'LOGIN_SUCCESS': return 'Login';
      case 'LOGIN_FAILED': return 'Failed Login';
      case 'REGISTER': return 'Registration';
      case 'LOGOUT': return 'Logout';
      default: return type;
    }
  }

  eventBadgeClass(type: string): string {
    switch (type) {
      case 'LOGIN_SUCCESS': return 'th-status-delivered';
      case 'LOGIN_FAILED': return 'th-status-cancelled';
      case 'REGISTER': return 'th-status-processing';
      case 'LOGOUT': return 'th-status-pending';
      default: return 'th-status-shipped';
    }
  }

  /** Shortens a raw user-agent string into a readable browser/device hint. */
  deviceHint(userAgent?: string): string {
    if (!userAgent) {
      return '-';
    }
    const ua = userAgent.toLowerCase();
    const os = ua.includes('android') ? 'Android'
      : (ua.includes('iphone') || ua.includes('ipad')) ? 'iOS'
      : ua.includes('windows') ? 'Windows'
      : ua.includes('mac os') ? 'macOS'
      : ua.includes('linux') ? 'Linux' : 'Other';
    const browser = ua.includes('edg/') ? 'Edge'
      : ua.includes('opr/') ? 'Opera'
      : ua.includes('chrome/') ? 'Chrome'
      : ua.includes('firefox/') ? 'Firefox'
      : ua.includes('safari/') ? 'Safari' : 'Browser';
    return `${browser} · ${os}`;
  }
}
