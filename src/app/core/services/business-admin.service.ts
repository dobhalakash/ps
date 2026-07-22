import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { BusinessDashboardStats, BusinessProfile, UpdatePaymentSettingsRequest } from '../models/business.model';

/**
 * Provides business-admin-scoped dashboard data.
 */
@Injectable({ providedIn: 'root' })
export class BusinessAdminService {

  private readonly baseUrl = `${environment.apiUrl}/business`;

  constructor(private http: HttpClient) {
  }

  getDashboard(): Observable<ApiResponse<BusinessDashboardStats>> {
    return this.http.get<ApiResponse<BusinessDashboardStats>>(`${this.baseUrl}/dashboard`);
  }

  getProfile(): Observable<ApiResponse<BusinessProfile>> {
    return this.http.get<ApiResponse<BusinessProfile>>(`${this.baseUrl}/profile`);
  }

  updatePaymentSettings(request: UpdatePaymentSettingsRequest): Observable<ApiResponse<BusinessProfile>> {
    return this.http.put<ApiResponse<BusinessProfile>>(`${this.baseUrl}/payment-settings`, request);
  }
}
