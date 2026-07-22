import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ProductSummary } from '../models/product.model';

/**
 * Manages the authenticated user's wishlist.
 */
@Injectable({ providedIn: 'root' })
export class WishlistService {

  private readonly baseUrl = `${environment.apiUrl}/wishlist`;

  /** IDs of products currently in the wishlist, used for quick UI lookups. */
  readonly wishlistProductIds = signal<Set<number>>(new Set());

  constructor(private http: HttpClient) {
  }

  getWishlist() {
    return this.http.get<ApiResponse<ProductSummary[]>>(this.baseUrl).pipe(
      tap(res => this.wishlistProductIds.set(new Set(res.data.map(p => p.id))))
    );
  }

  addToWishlist(productId: number) {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${productId}`, {}).pipe(
      tap(() => {
        const ids = new Set(this.wishlistProductIds());
        ids.add(productId);
        this.wishlistProductIds.set(ids);
      })
    );
  }

  removeFromWishlist(productId: number) {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${productId}`).pipe(
      tap(() => {
        const ids = new Set(this.wishlistProductIds());
        ids.delete(productId);
        this.wishlistProductIds.set(ids);
      })
    );
  }
}
