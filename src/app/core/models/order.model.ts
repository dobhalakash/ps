import { ProductSize } from './product.model';
import { Address } from './address.model';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'CANCELLED';

export type PaymentMethod = 'RAZORPAY' | 'UPI' | 'CARD' | 'NET_BANKING' | 'COD';

export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  productImageUrl: string | null;
  size: ProductSize | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type ShipmentStatus =
  | 'PENDING'
  | 'SHIPMENT_CREATED'
  | 'AWB_ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RTO'
  | 'CANCELLED';

export interface Shipment {
  orderId: number;
  orderNumber: string;
  status: ShipmentStatus;
  courierName: string | null;
  awbNumber: string | null;
  trackingUrl: string | null;
  source: 'SHIPROCKET' | 'MANUAL';
  lastTrackingNote: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  lastSyncedAt: string | null;
}

export interface ManualShipmentRequest {
  courierName: string;
  awbNumber: string;
  trackingUrl?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  items: OrderItem[];
  address: Address;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  grandTotal: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  codDueAmount: number | null;
  cancellationReason: string | null;
  returnReason: string | null;
  canCancel: boolean;
  canRequestReturn: boolean;
  customerCity: string | null;
  customerRegion: string | null;
  customerCountry: string | null;
  createdAt: string;
  shipment: Shipment | null;
}

export interface CheckoutRequest {
  addressId: number;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface UpiPaymentInfo {
  orderId: number;
  orderNumber: string;
  amount: number;
  payeeUpiId: string;
  payeeName: string;
  transactionNote: string;
  upiUri: string;
  paymentStatus: string;
}

export interface RazorpayOrderInfo {
  orderId: number;
  orderNumber: string;
  razorpayOrderId: string;
  keyId: string;
  amount: number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
