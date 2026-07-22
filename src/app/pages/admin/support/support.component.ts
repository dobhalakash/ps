import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { ManualShipmentRequest, Order } from '../../../core/models/order.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

/**
 * Order Support tool: lets support staff (or the super admin) look up any
 * order by order number, customer email, or AWB/tracking number and see
 * exactly where the package is - the same information a business admin
 * sees, without needing to know which business the order belongs to.
 */
@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class AdminSupportComponent {

  query = '';
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly results = signal<Order[]>([]);

  readonly expandedOrderId = signal<number | null>(null);
  readonly shipmentBusy = signal<number | null>(null);
  readonly shipmentError = signal<{ [orderId: number]: string }>({});
  manualForms: { [orderId: number]: ManualShipmentRequest } = {};

  private search$ = new Subject<string>();

  constructor(private orderService: OrderService) {
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) {
          this.searching.set(false);
          return [];
        }
        this.searching.set(true);
        return this.orderService.searchSupportOrders(q.trim());
      })
    ).subscribe({
      next: res => {
        this.searching.set(false);
        this.searched.set(true);
        this.results.set(res.data || []);
      },
      error: () => {
        this.searching.set(false);
        this.searched.set(true);
      }
    });
  }

  onQueryInput(): void {
    this.search$.next(this.query);
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

  isPaymentConfirmed(order: Order): boolean {
    return order.paymentMethod === 'COD' ? order.status !== 'CANCELLED' : order.paymentStatus === 'SUCCESS';
  }

  toggleShipping(order: Order): void {
    if (this.expandedOrderId() === order.id) {
      this.expandedOrderId.set(null);
      return;
    }
    if (!this.manualForms[order.id]) {
      this.manualForms[order.id] = {
        courierName: order.shipment?.courierName || '',
        awbNumber: order.shipment?.awbNumber || '',
        trackingUrl: order.shipment?.trackingUrl || ''
      };
    }
    this.expandedOrderId.set(order.id);
  }

  createShiprocketShipment(order: Order): void {
    this.setError(order.id, '');
    this.shipmentBusy.set(order.id);

    this.orderService.createShiprocketShipmentAsAdmin(order.id).subscribe({
      next: res => {
        this.shipmentBusy.set(null);
        this.updateOrderShipment(order.id, res.data);
      },
      error: err => {
        this.shipmentBusy.set(null);
        this.setError(order.id, err?.error?.message || 'Could not create Shiprocket shipment.');
      }
    });
  }

  saveManualShipment(order: Order): void {
    const form = this.manualForms[order.id];
    if (!form?.courierName || !form?.awbNumber) {
      this.setError(order.id, 'Courier name and AWB/tracking number are required.');
      return;
    }

    this.setError(order.id, '');
    this.shipmentBusy.set(order.id);

    this.orderService.saveManualShipmentAsAdmin(order.id, form).subscribe({
      next: res => {
        this.shipmentBusy.set(null);
        this.updateOrderShipment(order.id, res.data);
      },
      error: err => {
        this.shipmentBusy.set(null);
        this.setError(order.id, err?.error?.message || 'Could not save tracking details.');
      }
    });
  }

  refreshShipment(order: Order): void {
    this.setError(order.id, '');
    this.shipmentBusy.set(order.id);

    this.orderService.refreshShipmentAsAdmin(order.id).subscribe({
      next: res => {
        this.shipmentBusy.set(null);
        this.updateOrderShipment(order.id, res.data);
      },
      error: err => {
        this.shipmentBusy.set(null);
        this.setError(order.id, err?.error?.message || 'Could not refresh tracking status.');
      }
    });
  }

  private updateOrderShipment(orderId: number, shipment: Order['shipment']): void {
    this.results.set(this.results().map(o => o.id === orderId ? { ...o, shipment } : o));
  }

  private setError(orderId: number, message: string): void {
    this.shipmentError.set({ ...this.shipmentError(), [orderId]: message });
  }
}
