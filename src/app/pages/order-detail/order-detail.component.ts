import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {

  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly downloadingInvoice = signal(false);
  readonly invoiceError = signal('');

  readonly showCancelForm = signal(false);
  readonly showReturnForm = signal(false);
  readonly cancelReason = signal('');
  readonly returnReason = signal('');
  readonly cancelBusy = signal(false);
  readonly actionError = signal('');

  readonly statusSteps: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

  constructor(private route: ActivatedRoute, private orderService: OrderService) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    this.orderService.getOrder(id).subscribe({
      next: res => {
        this.order.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'th-status-delivered';
      case 'CANCELLED': return 'th-status-cancelled';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY': return 'th-status-shipped';
      default: return 'th-status-pending';
    }
  }

  stepIndex(status: OrderStatus): number {
    return this.statusSteps.indexOf(status);
  }

  isStepDone(step: OrderStatus): boolean {
    const order = this.order();
    if (!order || order.status === 'CANCELLED') {
      return false;
    }
    return this.stepIndex(step) <= this.stepIndex(order.status);
  }

  downloadInvoice(): void {
    const order = this.order();
    if (!order) return;

    this.invoiceError.set('');
    this.downloadingInvoice.set(true);

    this.orderService.downloadInvoice(order.id).subscribe({
      next: blob => {
        this.downloadingInvoice.set(false);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${order.orderNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloadingInvoice.set(false);
        this.invoiceError.set('Could not download invoice. Please try again.');
      }
    });
  }

  cancelOrder(): void {
    const order = this.order();
    if (!order || !this.cancelReason().trim()) {
      this.actionError.set('Please tell us why you\'re cancelling.');
      return;
    }
    this.cancelBusy.set(true);
    this.actionError.set('');

    this.orderService.cancelOrder(order.id, this.cancelReason().trim()).subscribe({
      next: res => {
        this.cancelBusy.set(false);
        this.order.set(res.data);
        this.showCancelForm.set(false);
      },
      error: err => {
        this.cancelBusy.set(false);
        this.actionError.set(err?.error?.message || 'Could not cancel this order.');
      }
    });
  }

  submitReturn(): void {
    const order = this.order();
    if (!order || !this.returnReason().trim()) {
      this.actionError.set('Please tell us why you\'d like to return this order.');
      return;
    }
    this.cancelBusy.set(true);
    this.actionError.set('');

    this.orderService.requestReturn(order.id, this.returnReason().trim()).subscribe({
      next: res => {
        this.cancelBusy.set(false);
        this.order.set(res.data);
        this.showReturnForm.set(false);
      },
      error: err => {
        this.cancelBusy.set(false);
        this.actionError.set(err?.error?.message || 'Could not submit your return request.');
      }
    });
  }
}
