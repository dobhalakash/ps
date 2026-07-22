import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AppliedCoupon, Coupon, CouponRequest } from '../models/coupon.model';

/**
 * Manages discount coupons.
 */
@Injectable({ providedIn: 'root' })
export class CouponService {

  private readonly cartUrl = `${environment.apiUrl}/cart`;
  private readonly adminUrl = `${environment.apiUrl}/admin/coupons`;

  constructor(private http: HttpClient) {
  }

  applyCoupon(code: string): Observable<ApiResponse<AppliedCoupon>> {
    return this.http.post<ApiResponse<AppliedCoupon>>(`${this.cartUrl}/apply-coupon`, { code });
  }

  // ---- Admin management ----

  getAllCoupons(): Observable<ApiResponse<Coupon[]>> {
    return this.http.get<ApiResponse<Coupon[]>>(this.adminUrl);
  }

  createCoupon(request: CouponRequest): Observable<ApiResponse<Coupon>> {
    return this.http.post<ApiResponse<Coupon>>(this.adminUrl, request);
  }

  updateCoupon(id: number, request: CouponRequest): Observable<ApiResponse<Coupon>> {
    return this.http.put<ApiResponse<Coupon>>(`${this.adminUrl}/${id}`, request);
  }

  deleteCoupon(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.adminUrl}/${id}`);
  }
}
