import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { Coupon, CouponRequest, DiscountType } from '../../../core/models/coupon.model';
import { AdminNavComponent } from '../../../shared/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavComponent],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.css'
})
export class AdminCouponsComponent implements OnInit {

  readonly coupons = signal<Coupon[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');

  readonly discountTypes: DiscountType[] = ['PERCENTAGE', 'FLAT'];

  form: CouponRequest = this.emptyForm();

  constructor(private couponService: CouponService) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.couponService.getAllCoupons().subscribe({
      next: res => {
        this.coupons.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  emptyForm(): CouponRequest {
    return {
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 0,
      maxDiscount: undefined,
      expiryDate: '',
      usageLimit: undefined,
      active: true
    };
  }

  startNew(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showForm.set(true);
    this.error.set('');
  }

  edit(coupon: Coupon): void {
    this.editingId.set(coupon.id);
    this.form = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount ?? undefined,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.substring(0, 10) : '',
      usageLimit: coupon.usageLimit ?? undefined,
      active: coupon.active
    };
    this.showForm.set(true);
    this.error.set('');
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    this.error.set('');
    const id = this.editingId();
    const request$ = id ? this.couponService.updateCoupon(id, this.form) : this.couponService.createCoupon(this.form);

    request$.subscribe({
      next: () => {
        this.showForm.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: err => this.error.set(err?.error?.message || 'Could not save coupon.')
    });
  }

  delete(coupon: Coupon): void {
    this.couponService.deleteCoupon(coupon.id).subscribe(() => this.load());
  }
}
