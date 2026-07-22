import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { Product, ProductRequest, ProductSearchParams, ProductSummary } from '../models/product.model';

/**
 * Provides access to the product catalog and business-scoped product management.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly baseUrl = `${environment.apiUrl}/products`;
  private readonly businessUrl = `${environment.apiUrl}/business/products`;

  constructor(private http: HttpClient) {
  }

  /** Uploads a CSV of products; returns {created, failed, errors[]}. */
  bulkUpload(file: File): Observable<ApiResponse<{ created: number; failed: number; errors: string[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ created: number; failed: number; errors: string[] }>>(
      `${this.businessUrl}/bulk-upload`, formData);
  }

  search(params: ProductSearchParams): Observable<ApiResponse<PageResponse<ProductSummary>>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value);
      }
    });
    return this.http.get<ApiResponse<PageResponse<ProductSummary>>>(this.baseUrl, { params: httpParams });
  }

  getTrending(): Observable<ApiResponse<ProductSummary[]>> {
    return this.http.get<ApiResponse<ProductSummary[]>>(`${this.baseUrl}/trending`);
  }

  getSuggestions(query: string): Observable<ApiResponse<ProductSummary[]>> {
    return this.http.get<ApiResponse<ProductSummary[]>>(`${this.baseUrl}/suggestions`, {
      params: new HttpParams().set('q', query)
    });
  }

  getRelated(productId: number, limit = 8): Observable<ApiResponse<ProductSummary[]>> {
    return this.http.get<ApiResponse<ProductSummary[]>>(`${this.baseUrl}/${productId}/related`, {
      params: new HttpParams().set('limit', limit)
    });
  }

  subscribeToStockAlert(productId: number, email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/${productId}/notify-me`, { email });
  }

  /** Fetches multiple products by id, for the "Recently Viewed" rail. Skips any that fail (e.g. deleted product). */
  getByIds(ids: number[]): Observable<ProductSummary[]> {
    if (ids.length === 0) {
      return of([]);
    }
    return forkJoin(ids.map(id => this.getById(id).pipe(
      map(res => this.toSummary(res.data)),
      catchError(() => of(null))
    ))).pipe(map(results => results.filter((p): p is ProductSummary => p !== null)));
  }

  private toSummary(product: Product): ProductSummary {
    const primaryImage = product.images?.find(i => i.primary) || product.images?.[0];
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      discountPercentage: product.discountPercentage,
      finalPrice: product.finalPrice,
      brand: product.brand,
      trending: product.trending,
      codEnabled: product.codEnabled,
      codAdvanceAmount: product.codAdvanceAmount,
      shippingCharge: product.shippingCharge,
      stock: product.stock,
      averageRating: product.averageRating,
      primaryImageUrl: primaryImage ? primaryImage.imageUrl : null,
      categoryName: product.categoryName
    };
  }

  getById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/${id}`);
  }

  // ---- Business admin ----

  getMyProducts(page = 0, size = 10): Observable<ApiResponse<PageResponse<Product>>> {
    return this.http.get<ApiResponse<PageResponse<Product>>>(this.businessUrl, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  createProduct(request: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.businessUrl, request);
  }

  updateProduct(id: number, request: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.businessUrl}/${id}`, request);
  }

  deleteProduct(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.businessUrl}/${id}`);
  }
}
