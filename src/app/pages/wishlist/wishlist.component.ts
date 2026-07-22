import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductSummary } from '../../core/models/product.model';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {

  readonly products = signal<ProductSummary[]>([]);
  readonly loading = signal(true);

  constructor(public wishlistService: WishlistService, public cartService: CartService, private toastService: ToastService, public authService: AuthService) {
  }

  ngOnInit(): void {
    this.wishlistService.getWishlist().subscribe({
      next: res => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  remove(product: ProductSummary): void {
    this.wishlistService.removeFromWishlist(product.id).subscribe(() => {
      this.products.set(this.products().filter(p => p.id !== product.id));
    });
  }

  addToCart(product: ProductSummary): void {
    if (!this.authService.canShop()) {
      this.toastService.show('Business and admin accounts cannot purchase products.', 'error');
      return;
    }
    this.cartService.addToCart({ product, quantity: 1 }).subscribe(() => {
      this.toastService.show(`${product.name} added to cart`);
    });
  }
}
