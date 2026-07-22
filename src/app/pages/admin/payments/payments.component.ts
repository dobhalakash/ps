import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';
import { ApiResponse, PageResponse } from '../../../core/models/api-response.model';

interface PaymentRecord {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  paymentMethod: string | null;
  status: string;
  amount: number;
  codDueAmount: number;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface PaymentSummary {
  totalSuccessful: number;
  totalFailed: number;
  totalPending: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class AdminPaymentsComponent implements OnInit {

  readonly summary = signal<PaymentSummary | null>(null);
  readonly payments = signal<PaymentRecord[]>([]);
  readonly loading = signal(true);
  readonly statusFilter = signal('');
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = 20;

  readonly expanded = signal<number | null>(null);

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.loadSummary();
    this.load();
  }

  loadSummary(): void {
    this.http.get<ApiResponse<PaymentSummary>>(`${environment.apiUrl}/admin/payments/summary`)
      .subscribe(res => this.summary.set(res.data));
  }

  load(): void {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', this.currentPage())
      .set('size', this.pageSize);
    const s = this.statusFilter();
    if (s) params = params.set('status', s);

    this.http.get<ApiResponse<PageResponse<PaymentRecord>>>(`${environment.apiUrl}/admin/payments`, { params })
      .subscribe({
        next: res => {
          this.payments.set(res.data.content);
          this.totalElements.set(res.data.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  toggle(id: number): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':   return 'th-status-paid';
      case 'PENDING':   return 'th-status-pending';
      case 'FAILED':    return 'th-status-failed';
      case 'CANCELLED': return 'th-status-cancelled';
      case 'REFUNDED':  return 'th-status-reversed';
      default:          return 'th-status-pending';
    }
  }

  totalPages(): number {
    return Math.ceil(this.totalElements() / this.pageSize);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }
}
