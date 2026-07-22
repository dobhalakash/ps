import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem } from '../../core/models/cart.model';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

  /** Per-cart-item image slider position (itemId -> current image index). */
  private readonly sliderIndex: { [itemId: number]: number } = {};

  imageIndex(item: { id: number }): number {
    return this.sliderIndex[item.id] || 0;
  }

  currentImage(item: { id: number; productImageUrl: string | null; productImageUrls?: string[] }): string {
    const urls = item.productImageUrls && item.productImageUrls.length > 0
      ? item.productImageUrls
      : (item.productImageUrl ? [item.productImageUrl] : []);
    if (urls.length === 0) {
      return 'https://images.unsplash.com/photo-1521577352947-9bb58764b69a?w=200';
    }
    const idx = Math.min(this.imageIndex(item), urls.length - 1);
    return urls[idx];
  }

  hasMultipleImages(item: { productImageUrls?: string[] }): boolean {
    return !!item.productImageUrls && item.productImageUrls.length > 1;
  }

  imageCount(item: { productImageUrl: string | null; productImageUrls?: string[] }): number {
    return item.productImageUrls?.length || (item.productImageUrl ? 1 : 0);
  }

  nextImage(item: { id: number; productImageUrls?: string[] }, event?: Event): void {
    event?.stopPropagation();
    const count = item.productImageUrls?.length || 0;
    if (count < 2) return;
    this.sliderIndex[item.id] = (this.imageIndex(item) + 1) % count;
  }

  prevImage(item: { id: number; productImageUrls?: string[] }, event?: Event): void {
    event?.stopPropagation();
    const count = item.productImageUrls?.length || 0;
    if (count < 2) return;
    this.sliderIndex[item.id] = (this.imageIndex(item) - 1 + count) % count;
  }

  /** Keyboard support: focus a cart image and use ←/→ arrow keys to slide. */
  onImageKeydown(item: { id: number; productImageUrls?: string[] }, event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextImage(item);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevImage(item);
    }
  }

  readonly activeItems = computed(() => this.cartService.cart().items.filter(i => !i.savedForLater));
  readonly savedItems = computed(() => this.cartService.cart().items.filter(i => i.savedForLater));

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    private router: Router
  ) {
    if (!this.authService.canShop()) {
      this.router.navigate(['/']);
    }
  }

  increment(item: CartItem): void {
    this.cartService.updateItem(item.id, { quantity: item.quantity + 1 }).subscribe();
  }

  decrement(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateItem(item.id, { quantity: item.quantity - 1 }).subscribe();
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.id).subscribe();
  }

  saveForLater(item: CartItem): void {
    this.cartService.updateItem(item.id, { savedForLater: true }).subscribe();
  }

  moveToCart(item: CartItem): void {
    this.cartService.updateItem(item.id, { savedForLater: false }).subscribe();
  }

  proceedToCheckout(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
