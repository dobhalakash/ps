import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductSummary, ProductSearchParams } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {

  readonly products = signal<ProductSummary[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly filtersOpen = signal(false);

  // "Adjustable" filter sections - each can be collapsed/expanded independently,
  // so the filter panel doesn't feel like one long fixed block on small screens.
  readonly expandedSections = signal<{ [key: string]: boolean }>({
    category: true,
    brand: true,
    price: true,
    sort: true
  });

  toggleSection(key: string): void {
    this.expandedSections.set({ ...this.expandedSections(), [key]: !this.expandedSections()[key] });
  }

  filters: ProductSearchParams = {
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    sortDir: 'desc'
  };

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    public cartService: CartService,
    public wishlistService: WishlistService,
    public authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.categoryService.getActiveCategories().subscribe(res => this.categories.set(res.data));

    this.route.queryParams.subscribe(params => {
      this.filters = {
        page: 0,
        size: 12,
        sortBy: params['sortBy'] || 'createdAt',
        sortDir: params['sortDir'] || 'desc',
        categoryId: params['categoryId'] ? Number(params['categoryId']) : undefined,
        brand: params['brand'] || undefined,
        keyword: params['keyword'] || undefined,
        minPrice: params['minPrice'] ? Number(params['minPrice']) : undefined,
        maxPrice: params['maxPrice'] ? Number(params['maxPrice']) : undefined
      };
      this.search();
    });

    if (this.authService.isLoggedIn()) {
      this.wishlistService.getWishlist().subscribe();
    }
  }

  search(): void {
    this.loading.set(true);
    this.productService.search(this.filters).subscribe({
      next: res => {
        this.products.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleFilters(): void {
    this.filtersOpen.set(!this.filtersOpen());
  }

  applyFilters(): void {
    this.filters.page = 0;
    this.search();
    this.filtersOpen.set(false);
  }

  clearFilters(): void {
    this.filters = { page: 0, size: 12, sortBy: 'createdAt', sortDir: 'desc' };
    this.router.navigate(['/products']);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) {
      return;
    }
    this.filters.page = page;
    this.search();
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

  toggleWishlist(product: ProductSummary): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.wishlistService.wishlistProductIds().has(product.id)) {
      this.wishlistService.removeFromWishlist(product.id).subscribe();
    } else {
      this.wishlistService.addToWishlist(product.id).subscribe();
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }
}
