import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayoutService } from '../../../core/services/payout.service';
import { Payout, PayoutStatusHistory, PayoutSummary } from '../../../core/models/payout.model';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';

@Component({
  selector: 'app-business-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessNavComponent],
  templateUrl: './payouts.component.html',
  styleUrl: './payouts.component.css'
})
export class BusinessPayoutsComponent implements OnInit {

  readonly summary = signal<PayoutSummary | null>(null);
  readonly payouts = signal<Payout[]>([]);
  readonly loading = signal(true);
  readonly statusFilter = signal('');

  readonly selectedPayout = signal<Payout | null>(null);
  readonly history = signal<PayoutStatusHistory[]>([]);
  readonly loadingHistory = signal(false);

  readonly disputeNote = signal('');
  readonly showDisputeForm = signal(false);
  readonly disputeBusy = signal(false);
  readonly disputeError = signal('');

  constructor(private payoutService: PayoutService) {
  }

  ngOnInit(): void {
    this.payoutService.getOwnSummary().subscribe(res => this.summary.set(res.data));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const status = this.statusFilter();
    this.payoutService.getOwnPayouts(status || undefined, 0, 50).subscribe({
      next: res => {
        this.payouts.set(res.data.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openDetail(payout: Payout): void {
    this.selectedPayout.set(payout);
    this.showDisputeForm.set(false);
    this.loadingHistory.set(true);
    this.payoutService.getOwnHistory(payout.id).subscribe({
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

  submitDispute(): void {
    const payout = this.selectedPayout();
    if (!payout || !this.disputeNote().trim()) return;

    this.disputeBusy.set(true);
    this.disputeError.set('');
    this.payoutService.raiseDispute(payout.id, this.disputeNote().trim()).subscribe({
      next: res => {
        this.disputeBusy.set(false);
        this.selectedPayout.set(res.data);
        this.showDisputeForm.set(false);
        this.payouts.update(list => list.map(p => p.id === res.data.id ? res.data : p));
      },
      error: err => {
        this.disputeBusy.set(false);
        this.disputeError.set(err?.error?.message || 'Could not raise dispute.');
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PAID':           return 'th-status-paid';
      case 'PENDING':        return 'th-status-pending';
      case 'PROCESSING':     return 'th-status-processing';
      case 'PARTIALLY_PAID': return 'th-status-partial';
      case 'FAILED':         return 'th-status-failed';
      case 'CANCELLED':      return 'th-status-cancelled';
      case 'REVERSED':       return 'th-status-reversed';
      case 'DISPUTED':       return 'th-status-disputed';
      default:               return 'th-status-pending';
    }
  }
}
