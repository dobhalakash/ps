import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayoutService } from '../../../core/services/payout.service';
import { UploadService } from '../../../core/services/upload.service';
import { Payout, PayoutStatusHistory, MarkPayoutPaidRequest } from '../../../core/models/payout.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './payouts.component.html',
  styleUrl: './payouts.component.css'
})
export class AdminPayoutsComponent implements OnInit {

  readonly payouts = signal<Payout[]>([]);
  readonly loading = signal(true);
  readonly statusFilter = signal('');
  readonly totalElements = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = 20;

  readonly selectedPayout = signal<Payout | null>(null);
  readonly history = signal<PayoutStatusHistory[]>([]);
  readonly loadingHistory = signal(false);

  readonly showUpdateForm = signal(false);
  readonly updating = signal(false);
  readonly uploading = signal(false);
  readonly updateError = signal('');

  updateForm: MarkPayoutPaidRequest = {
    status: '',
    payoutMethod: '',
    utrNumber: '',
    remarks: '',
    proofUrl: '',
    proofName: ''
  };

  readonly statuses = ['PENDING', 'PROCESSING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'CANCELLED', 'REVERSED', 'DISPUTED'];
  readonly methods = ['UPI', 'NEFT', 'IMPS', 'RTGS'];

  constructor(
    private payoutService: PayoutService,
    private uploadService: UploadService
  ) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const status = this.statusFilter();
    this.payoutService.getAllPayouts(status || undefined, this.currentPage(), this.pageSize).subscribe({
      next: res => {
        this.payouts.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openDetail(payout: Payout): void {
    this.selectedPayout.set(payout);
    this.showUpdateForm.set(false);
    this.updateError.set('');
    this.updateForm = {
      status: payout.status,
      payoutMethod: payout.payoutMethod || '',
      utrNumber: payout.utrNumber || '',
      remarks: payout.remarks || '',
      proofUrl: payout.proofUrl || '',
      proofName: payout.proofName || ''
    };
    this.loadingHistory.set(true);
    this.payoutService.getHistory(payout.id).subscribe({
      next: res => {
        this.history.set(res.data);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false)
    });
  }

  closeDetail(): void {
    this.selectedPayout.set(null);
    this.history.set([]);
  }

  onProofFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.uploadService.uploadDocument(file).subscribe({
      next: res => {
        this.uploading.set(false);
        this.updateForm.proofUrl = res.data.url;
        this.updateForm.proofName = res.data.filename;
        input.value = '';
      },
      error: err => {
        this.uploading.set(false);
        this.updateError.set(err?.error?.message || 'Could not upload file.');
        input.value = '';
      }
    });
  }

  submitUpdate(): void {
    const payout = this.selectedPayout();
    if (!payout) return;
    this.updating.set(true);
    this.updateError.set('');

    this.payoutService.updateStatus(payout.id, this.updateForm).subscribe({
      next: res => {
        this.updating.set(false);
        this.selectedPayout.set(res.data);
        this.showUpdateForm.set(false);
        this.payouts.update(list => list.map(p => p.id === res.data.id ? res.data : p));
        this.payoutService.getHistory(payout.id).subscribe(h => this.history.set(h.data));
      },
      error: err => {
        this.updating.set(false);
        this.updateError.set(err?.error?.message || 'Could not update payout.');
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PAID':         return 'th-status-paid';
      case 'PENDING':      return 'th-status-pending';
      case 'PROCESSING':   return 'th-status-processing';
      case 'PARTIALLY_PAID': return 'th-status-partial';
      case 'FAILED':       return 'th-status-failed';
      case 'CANCELLED':    return 'th-status-cancelled';
      case 'REVERSED':     return 'th-status-reversed';
      case 'DISPUTED':     return 'th-status-disputed';
      default:             return 'th-status-pending';
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
