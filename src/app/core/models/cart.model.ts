import { ProductSize } from './product.model';

export interface CartItem {
  id: number;
  productId: number | null;
  productName: string;
  productImageUrl: string | null;
  productImageUrls?: string[];
  size: ProductSize | null;
  quantity: number;
  priceAtAdd: number;
  lineTotal: number;
  savedForLater: boolean;
  availableStock: number | null;
  codEnabled: boolean;
  codAdvanceAmount: number | null;
  shippingCharge: number | null;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export interface AddCartItemRequest {
  productId?: number;
  size?: ProductSize;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity?: number;
  savedForLater?: boolean;
}

export interface MergeCartRequest {
  items: AddCartItemRequest[];
}
