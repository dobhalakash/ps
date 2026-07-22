import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { Review, ReviewRequest } from '../models/review.model';

/**
 * Manages product reviews.
 */
@Injectable({ providedIn: 'root' })
export class ReviewService {

  private readonly baseUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {
  }

  getReviews(productId: number, page = 0, size = 10): Observable<ApiResponse<PageResponse<Review>>> {
    return this.http.get<ApiResponse<PageResponse<Review>>>(`${this.baseUrl}/${productId}/reviews`, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  createReview(productId: number, request: ReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.baseUrl}/${productId}/reviews`, request);
  }
}
