import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AddCartItemRequest,
  Cart,
  MergeCartRequest,
  UpdateCartItemRequest
} from '../models/cart.model';
import { ProductSize, Product, ProductSummary } from '../models/product.model';
import { AuthService } from './auth.service';

const GUEST_CART_KEY = 'dn_guest_cart';

/**
 * Options describing an item to add to the cart, used for both the
 * authenticated (server-backed) and guest (localStorage) cart.
 */
export interface AddToCartOptions {
  product?: Product | ProductSummary;
  size?: ProductSize;
  quantity: number;
}

/**
 * Manages the shopping cart. For authenticated users the cart is persisted
 * via the backend API. For guests the cart is kept in localStorage and
 * merged into the server cart on login via {@link mergeGuestCart}.
 */
@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly baseUrl = `${environment.apiUrl}/cart`;

  /** The current cart contents, kept in sync with the server or localStorage. */
  readonly cart = signal<Cart>(this.emptyCart());

  constructor(private http: HttpClient, private authService: AuthService) {
    this.refresh();
  }

  /** Reloads the cart from the appropriate source (server or local). */
  refresh(): void {
    if (this.authService.isLoggedIn()) {
      this.http.get<ApiResponse<Cart>>(this.baseUrl).subscribe({
        next: res => this.cart.set(res.data),
        error: () => this.cart.set(this.emptyCart())
      });
    } else {
      this.cart.set(this.readGuestCart());
    }
  }

  addToCart(options: AddToCartOptions): Observable<unknown> {
    if (this.authService.isLoggedIn()) {
      const request: AddCartItemRequest = {
        productId: options.product?.id,
        size: options.size,
        quantity: options.quantity
      };
      return this.http.post<ApiResponse<Cart>>(`${this.baseUrl}/items`, request)
        .pipe(tap(res => this.cart.set(res.data)));
    }

    const guestCart = this.readGuestCart();
    const product = options.product;

    if (product) {
      const existing = guestCart.items.find(i =>
        i.productId === product.id && i.size === (options.size ?? null) && !i.savedForLater);

      if (existing) {
        existing.quantity += options.quantity;
        existing.lineTotal = existing.priceAtAdd * existing.quantity;
      } else {
        const finalPrice = 'finalPrice' in product ? product.finalPrice : (product as Product).finalPrice;
        const imageUrl = 'primaryImageUrl' in product
          ? product.primaryImageUrl
          : (product as Product).images?.find(img => img.primary)?.imageUrl ?? (product as Product).images?.[0]?.imageUrl ?? null;

        guestCart.items.push({
          id: this.generateLocalId(),
          productId: product.id,
          productName: product.name,
          productImageUrl: imageUrl,
          size: options.size ?? null,
          quantity: options.quantity,
          priceAtAdd: finalPrice,
          lineTotal: finalPrice * options.quantity,
          savedForLater: false,
          availableStock: product.stock,
          codEnabled: product.codEnabled,
          codAdvanceAmount: product.codAdvanceAmount ?? 0,
          shippingCharge: product.shippingCharge ?? 0
        });
      }
    }

    this.recalculate(guestCart);
    this.saveGuestCart(guestCart);
    return of(guestCart);
  }

  updateItem(itemId: number, request: UpdateCartItemRequest): Observable<unknown> {
    if (this.authService.isLoggedIn()) {
      return this.http.put<ApiResponse<Cart>>(`${this.baseUrl}/items/${itemId}`, request)
        .pipe(tap(res => this.cart.set(res.data)));
    }

    const guestCart = this.readGuestCart();
    const item = guestCart.items.find(i => i.id === itemId);
    if (item) {
      if (request.quantity !== undefined) {
        item.quantity = request.quantity;
        item.lineTotal = item.priceAtAdd * item.quantity;
      }
      if (request.savedForLater !== undefined) {
        item.savedForLater = request.savedForLater;
      }
    }
    this.recalculate(guestCart);
    this.saveGuestCart(guestCart);
    return of(guestCart);
  }

  removeItem(itemId: number): Observable<unknown> {
    if (this.authService.isLoggedIn()) {
      return this.http.delete<ApiResponse<Cart>>(`${this.baseUrl}/items/${itemId}`)
        .pipe(tap(res => this.cart.set(res.data)));
    }

    const guestCart = this.readGuestCart();
    guestCart.items = guestCart.items.filter(i => i.id !== itemId);
    this.recalculate(guestCart);
    this.saveGuestCart(guestCart);
    return of(guestCart);
  }

  clearCart(): Observable<unknown> {
    if (this.authService.isLoggedIn()) {
      return this.http.delete<ApiResponse<void>>(this.baseUrl)
        .pipe(tap(() => this.cart.set(this.emptyCart())));
    }
    this.saveGuestCart(this.emptyCart());
    this.cart.set(this.emptyCart());
    return of(null);
  }

  /**
   * Sends all non-saved-for-later items from the guest (localStorage) cart
   * to the server cart, then clears local storage. Should be called once
   * after a successful login or registration.
   */
  mergeGuestCart(): Observable<unknown> {
    const guestCart = this.readGuestCart();
    const activeItems = guestCart.items.filter(i => !i.savedForLater);

    if (activeItems.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
      this.refresh();
      return of(null);
    }

    const request: MergeCartRequest = {
      items: activeItems.map(i => ({
        productId: i.productId ?? undefined,
        size: i.size ?? undefined,
        quantity: i.quantity
      }))
    };

    return this.http.post<ApiResponse<Cart>>(`${this.baseUrl}/merge`, request).pipe(
      tap(res => {
        localStorage.removeItem(GUEST_CART_KEY);
        this.cart.set(res.data);
      })
    );
  }

  private recalculate(cart: Cart): void {
    const active = cart.items.filter(i => !i.savedForLater);
    cart.subtotal = active.reduce((sum, i) => sum + i.lineTotal, 0);
    cart.totalItems = active.reduce((sum, i) => sum + i.quantity, 0);
  }

  private readGuestCart(): Cart {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      return this.emptyCart();
    }
    try {
      return JSON.parse(raw) as Cart;
    } catch {
      return this.emptyCart();
    }
  }

  private saveGuestCart(cart: Cart): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  }

  private emptyCart(): Cart {
    return { id: 0, items: [], subtotal: 0, totalItems: 0 };
  }

  private generateLocalId(): number {
    return -Math.floor(Date.now() + Math.random() * 1000);
  }
}
