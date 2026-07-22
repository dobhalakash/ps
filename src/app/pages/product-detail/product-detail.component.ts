import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product.service';
import { ReviewService } from '../../core/services/review.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, ProductImage, ProductSize, ProductSummary } from '../../core/models/product.model';
import { Review, ReviewRequest } from '../../core/models/review.model';
import { RecentlyViewedService } from '../../core/services/recently-viewed.service';
import { TPipe } from '../../shared/pipes/t.pipe';
import { UploadService } from '../../core/services/upload.service';
import { ShippingService } from '../../core/services/shipping.service';
import { I18nService } from '../../core/services/i18n.service';
import { FEATURES } from '../../core/edition';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [TPipe, CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  readonly features = FEATURES;

  readonly product = signal<Product | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly selectedImage = signal<ProductImage | null>(null);
  /** URL of the currently playing video, or null when an image is selected. */
  readonly selectedVideo = signal<string | null>(null);
  readonly selectedSize = signal<ProductSize | null>(null);
  readonly quantity = signal(1);
  readonly loading = signal(true);
  readonly addedMessage = signal(false);
  readonly showSizeGuide = signal(false);

  readonly relatedProducts = signal<ProductSummary[]>([]);
  readonly recentlyViewed = signal<ProductSummary[]>([]);

  readonly notifyEmail = signal('');
  readonly notifySubscribed = signal(false);
  readonly notifyBusy = signal(false);
  readonly notifyError = signal('');

  reviewForm: ReviewRequest = { rating: 5, comment: '' };
  readonly uploadingReviewPhoto = signal(false);

  // Pincode delivery checker
  pincodeInput = '';
  readonly checkingPincode = signal(false);
  readonly pincodeResult = signal<{ available: boolean | null; estimatedDays?: number; courierName?: string } | null>(null);
  reviewSubmitting = false;
  reviewError = '';
  reviewSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private reviewService: ReviewService,
    public cartService: CartService,
    public wishlistService: WishlistService,
    public authService: AuthService,
    private toastService: ToastService,
    private recentlyViewedService: RecentlyViewedService,
    public i18n: I18nService,
    private uploadService: UploadService,
    private shippingService: ShippingService
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      this.loadProduct(id);
      this.loadReviews(id);
      this.loadRelated(id);
      this.loadRecentlyViewed(id);
      this.recentlyViewedService.record(id);
    });

    if (this.authService.isLoggedIn()) {
      this.wishlistService.getWishlist().subscribe();
    }
  }

  loadRelated(id: number): void {
    this.productService.getRelated(id, 8).subscribe(res => this.relatedProducts.set(res.data));
  }

  loadRecentlyViewed(currentId: number): void {
    const ids = this.recentlyViewedService.getIds(currentId).slice(0, 8);
    if (ids.length === 0) {
      this.recentlyViewed.set([]);
      return;
    }
    this.productService.getByIds(ids).subscribe(products => this.recentlyViewed.set(products));
  }

  subscribeStockAlert(): void {
    const product = this.product();
    if (!product || !this.notifyEmail().trim()) {
      this.notifyError.set('Please enter your email address.');
      return;
    }
    this.notifyBusy.set(true);
    this.notifyError.set('');

    this.productService.subscribeToStockAlert(product.id, this.notifyEmail().trim()).subscribe({
      next: () => {
        this.notifyBusy.set(false);
        this.notifySubscribed.set(true);
      },
      error: err => {
        this.notifyBusy.set(false);
        this.notifyError.set(err?.error?.message || 'Could not subscribe. Please try again.');
      }
    });
  }

  loadProduct(id: number): void {
    this.loading.set(true);
    this.productService.getById(id).subscribe({
      next: res => {
        this.product.set(res.data);
        const images = res.data.images || [];
        this.selectedImage.set(images.find(i => i.primary) || images[0] || null);
        if (res.data.variants && res.data.variants.length > 0) {
          this.selectedSize.set(res.data.variants[0].size);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadReviews(id: number): void {
    this.reviewService.getReviews(id, 0, 20).subscribe(res => this.reviews.set(res.data.content));
  }

  selectImage(image: ProductImage): void {
    this.selectedVideo.set(null);
    this.selectedImage.set(image);
  }

  nextGalleryImage(): void {
    const images = this.product()?.images || [];
    if (images.length < 2) return;
    const current = this.selectedImage();
    const idx = current ? images.findIndex(i => i.id === current.id) : 0;
    this.selectedVideo.set(null);
    this.selectedImage.set(images[(idx + 1) % images.length]);
  }

  prevGalleryImage(): void {
    const images = this.product()?.images || [];
    if (images.length < 2) return;
    const current = this.selectedImage();
    const idx = current ? images.findIndex(i => i.id === current.id) : 0;
    this.selectedVideo.set(null);
    this.selectedImage.set(images[(idx - 1 + images.length) % images.length]);
  }

  onGalleryKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') { event.preventDefault(); this.nextGalleryImage(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); this.prevGalleryImage(); }
  }

  selectVideo(url: string): void {
    this.selectedVideo.set(url);
  }

  selectSize(size: ProductSize): void {
    this.selectedSize.set(size);
  }

  changeQuantity(delta: number): void {
    const next = this.quantity() + delta;
    if (next >= 1) {
      this.quantity.set(next);
    }
  }

  variantStock(size: ProductSize): number | null {
    const product = this.product();
    if (!product?.variants?.length) {
      return null;
    }
    const variant = product.variants.find(v => v.size === size);
    return variant ? variant.stock : 0;
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }
    if (!this.authService.canShop()) {
      this.toastService.show('Business and admin accounts cannot purchase products.', 'error');
      return;
    }
    this.cartService.addToCart({
      product,
      size: this.selectedSize() ?? undefined,
      quantity: this.quantity()
    }).subscribe(() => {
      this.addedMessage.set(true);
      this.toastService.show(`${product.name} added to cart`);
      setTimeout(() => this.addedMessage.set(false), 2500);
    });
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product) {
      return;
    }
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

  onReviewPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingReviewPhoto.set(true);
    this.uploadService.uploadReviewImage(file).subscribe({
      next: res => {
        this.uploadingReviewPhoto.set(false);
        this.reviewForm.imageUrl = res.data.url;
        input.value = '';
      },
      error: () => {
        this.uploadingReviewPhoto.set(false);
        input.value = '';
      }
    });
  }

  removeReviewPhoto(): void {
    this.reviewForm.imageUrl = undefined;
  }

  checkPincode(): void {
    const pin = this.pincodeInput.trim();
    if (!/^\d{6}$/.test(pin)) {
      this.pincodeResult.set({ available: null });
      return;
    }
    this.checkingPincode.set(true);
    this.pincodeResult.set(null);
    this.shippingService.checkDelivery(pin).subscribe({
      next: res => {
        this.checkingPincode.set(false);
        this.pincodeResult.set(res.data as any);
      },
      error: () => {
        this.checkingPincode.set(false);
        this.pincodeResult.set({ available: null });
      }
    });
  }

  resolveUploadUrl(url: string): string {
    return this.uploadService.resolveUrl(url);
  }

  submitReview(): void {
    const product = this.product();
    if (!product) {
      return;
    }
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.reviewSubmitting = true;
    this.reviewError = '';
    this.reviewService.createReview(product.id, this.reviewForm).subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.reviewSuccess = true;
        this.reviewForm = { rating: 5, comment: '' };
        this.loadReviews(product.id);
        this.loadProduct(product.id);
      },
      error: err => {
        this.reviewSubmitting = false;
        this.reviewError = err?.error?.message || 'Unable to submit review.';
      }
    });
  }

  get averageRatingStars(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
