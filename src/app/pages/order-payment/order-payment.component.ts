import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { RazorpayOrderInfo } from '../../core/models/order.model';

declare const Razorpay: any;

@Component({
  selector: 'app-order-payment',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-payment.component.html',
  styleUrl: './order-payment.component.css'
})
export class OrderPaymentComponent implements OnInit {

  readonly loading = signal(true);
  readonly opening = signal(false);
  readonly error = signal('');
  readonly paid = signal(false);
  readonly cod = signal(false);
  readonly isCodAdvance = signal(false);

  orderInfo: RazorpayOrderInfo | null = null;
  orderId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {
  }

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.params['id']);
    this.checkCurrentStatus();
  }

  /**
   * Always starts by asking the backend for the order's real, authoritative
   * payment status - never trust anything cached on the client. If a
   * previous attempt already succeeded (e.g. the customer refreshed after
   * paying), we show the success screen immediately without opening
   * Checkout again.
   */
  private checkCurrentStatus(): void {
    this.loading.set(true);
    this.error.set('');

    this.orderService.getOrder(this.orderId).subscribe({
      next: res => {
        const order = res.data;
        const hasAdvanceDue = order.paymentMethod === 'COD' && !!order.codDueAmount;
        this.isCodAdvance.set(hasAdvanceDue);

        if (order.paymentMethod === 'COD' && !hasAdvanceDue) {
          // Pure COD - nothing to pay online, full amount collected in cash at delivery.
          this.cod.set(true);
          this.loading.set(false);
          return;
        }
        if (order.paymentStatus === 'SUCCESS') {
          this.paid.set(true);
          this.loading.set(false);
          return;
        }
        this.loading.set(false);
        this.startPayment();
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Could not load this order.');
      }
    });
  }

  /** Creates (or reuses) a Razorpay order on the backend and opens Checkout. */
  startPayment(): void {
    this.error.set('');
    this.opening.set(true);

    this.orderService.createRazorpayOrder(this.orderId).subscribe({
      next: res => {
        this.orderInfo = res.data;
        this.opening.set(false);
        this.openCheckout(res.data);
      },
      error: err => {
        this.opening.set(false);
        this.error.set(err?.error?.message || 'Could not start payment. Please try again.');
      }
    });
  }

  private openCheckout(info: RazorpayOrderInfo): void {
    if (typeof Razorpay === 'undefined') {
      this.error.set('Payment gateway failed to load. Please check your connection and try again.');
      return;
    }

    const options = {
      key: info.keyId,
      amount: Math.round(info.amount * 100),
      currency: info.currency,
      name: 'TrackHub',
      description: `Order ${info.orderNumber}`,
      order_id: info.razorpayOrderId,
      prefill: {
        name: info.customerName || undefined,
        email: info.customerEmail || undefined,
        contact: info.customerPhone || undefined
      },
      theme: { color: '#123A78' },
      // Razorpay's Checkout already lets the customer choose UPI, card,
      // netbanking, or wallet inside this one widget - including scanning a
      // UPI QR code or paying via UPI intent on mobile.
      handler: (response: any) => this.onCheckoutSuccess(response),
      modal: {
        ondismiss: () => {
          this.error.set('Payment was not completed. You can try again whenever you\'re ready.');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (resp: any) => {
      this.error.set(resp?.error?.description || 'Payment failed. Please try again or use a different payment method.');
    });
    rzp.open();
  }

  /**
   * Sends Razorpay's callback values to the backend, which independently
   * recomputes the HMAC signature against our secret key before trusting
   * anything. Only once the backend confirms verification do we treat the
   * order as paid - we never flip the UI to "success" based on the
   * client-side callback alone.
   */
  private onCheckoutSuccess(response: any): void {
    this.loading.set(true);
    this.orderService.verifyPayment(this.orderId, {
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    }).subscribe({
      next: () => {
        // Per spec: once verification is confirmed, refresh the page so the
        // user lands on a clean, freshly-loaded success state rather than a
        // client-side state flip.
        window.location.reload();
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message ||
          'We could not verify your payment yet. If money was deducted, please wait a minute and refresh this page.');
      }
    });
  }

  retry(): void {
    this.startPayment();
  }

  goToOrder(): void {
    this.router.navigate(['/orders', this.orderId]);
  }
}
