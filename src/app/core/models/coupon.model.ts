export type DiscountType = 'PERCENTAGE' | 'FLAT';

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  expiryDate: string | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
}

export interface CouponRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit?: number;
  active?: boolean;
}

export interface AppliedCoupon {
  code: string;
  subtotal: number;
  discount: number;
  total: number;
}
