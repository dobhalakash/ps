import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { ManualShipmentRequest, Order, OrderStatus } from '../../../core/models/order.model';
import { BusinessNavComponent } from '../../../shared/business-nav/business-nav.component';

@Component({
  selector: 'app-business-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessNavComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class BusinessOrdersComponent implements OnInit {

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(0);

  readonly statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  readonly expandedOrderId = signal<number | null>(null);
  readonly shipmentBusy = signal<number | null>(null);
  readonly shipmentError = signal<{ [orderId: number]: string }>({});
  manualForms: { [orderId: number]: ManualShipmentRequest } = {};

  constructor(private orderService: OrderService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.orderService.getBusinessOrders(this.page(), 10).subscribe({
      next: res => {
        this.orders.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  updateStatus(order: Order, status: OrderStatus): void {
    this.orderService.updateOrderStatusAsBusiness(order.id, { status }).subscribe(res => {
      this.orders.set(this.orders().map(o => o.id === order.id ? res.data : o));
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'th-status-delivered';
      case 'CANCELLED': return 'th-status-cancelled';
      case 'RETURN_REQUESTED': return 'th-status-pending';
      case 'RETURNED': return 'th-status-cancelled';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY': return 'th-status-shipped';
      default: return 'th-status-pending';
    }
  }

  decideReturn(order: Order, approve: boolean): void {
    this.orderService.decideReturnAsBusiness(order.id, approve).subscribe(res => {
      this.orders.set(this.orders().map(o => o.id === order.id ? res.data : o));
    });
  }

  // ---- Shipping / tracking ----

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

  isPaymentConfirmed(order: Order): boolean {
    return order.paymentMethod === 'COD' ? order.status !== 'CANCELLED' : order.paymentStatus === 'SUCCESS';
  }

  createShiprocketShipment(order: Order): void {
    this.setError(order.id, '');
    this.shipmentBusy.set(order.id);

    this.orderService.createShiprocketShipmentAsBusiness(order.id).subscribe({
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

    this.orderService.saveManualShipmentAsBusiness(order.id, form).subscribe({
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

    this.orderService.refreshShipmentAsBusiness(order.id).subscribe({
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
    this.orders.set(this.orders().map(o => o.id === orderId ? { ...o, shipment } : o));
  }

  private setError(orderId: number, message: string): void {
    this.shipmentError.set({ ...this.shipmentError(), [orderId]: message });
  }
}
