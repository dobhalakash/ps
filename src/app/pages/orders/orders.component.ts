import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.model';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly totalPages = signal(0);

  constructor(private orderService: OrderService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.orderService.getMyOrders(this.page(), 10).subscribe({
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

  statusClass(status: string): string {
    switch (status) {
      case 'DELIVERED': return 'th-status-delivered';
      case 'CANCELLED': return 'th-status-cancelled';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY': return 'th-status-shipped';
      default: return 'th-status-pending';
    }
  }
}
