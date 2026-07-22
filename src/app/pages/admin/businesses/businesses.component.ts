import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { BusinessProfile, BusinessStatus } from '../../../core/models/business.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-businesses',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './businesses.component.html',
  styleUrl: './businesses.component.css'
})
export class AdminBusinessesComponent implements OnInit {

  readonly businesses = signal<BusinessProfile[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly filterStatus = signal<BusinessStatus | ''>('');

  readonly statuses: BusinessStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
  readonly error = signal('');
  readonly updatingId = signal<number | null>(null);

  constructor(private superAdminService: SuperAdminService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.superAdminService.getBusinesses(this.filterStatus() || undefined, this.page(), 10).subscribe({
      next: res => {
        this.businesses.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Could not load business accounts. Please try again.');
      }
    });
  }

  setFilter(status: BusinessStatus | ''): void {
    this.filterStatus.set(status);
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

  updateStatus(business: BusinessProfile, status: BusinessStatus): void {
    this.error.set('');
    this.updatingId.set(business.id);
    this.superAdminService.updateBusinessStatus(business.id, { status }).subscribe({
      next: res => {
        this.businesses.set(this.businesses().map(b => b.id === business.id ? res.data : b));
        this.updatingId.set(null);
      },
      error: err => {
        this.updatingId.set(null);
        this.error.set(err?.error?.message || `Could not update status to ${status}. Please try again.`);
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'th-status-delivered';
      case 'REJECTED':
      case 'SUSPENDED': return 'th-status-cancelled';
      default: return 'th-status-pending';
    }
  }
}
