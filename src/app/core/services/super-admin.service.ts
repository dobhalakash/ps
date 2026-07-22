import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { AdminDashboardStats, BusinessApprovalRequest, BusinessProfile } from '../models/business.model';
import { RoleName, User } from '../models/user.model';

/**
 * Provides super-admin-scoped platform management: dashboard stats,
 * business approvals, and user management.
 */
@Injectable({ providedIn: 'root' })
export class SuperAdminService {

  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {
  }

  getDashboard(): Observable<ApiResponse<AdminDashboardStats>> {
    return this.http.get<ApiResponse<AdminDashboardStats>>(`${this.baseUrl}/dashboard`);
  }

  getBusinesses(status?: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<BusinessProfile>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ApiResponse<PageResponse<BusinessProfile>>>(`${this.baseUrl}/businesses`, { params });
  }

  updateBusinessStatus(id: number, request: BusinessApprovalRequest): Observable<ApiResponse<BusinessProfile>> {
    return this.http.put<ApiResponse<BusinessProfile>>(`${this.baseUrl}/businesses/${id}/status`, request);
  }

  getUsers(role: RoleName, page = 0, size = 10): Observable<ApiResponse<PageResponse<User>>> {
    const params = new HttpParams().set('role', role).set('page', page).set('size', size);
    return this.http.get<ApiResponse<PageResponse<User>>>(`${this.baseUrl}/users`, { params });
  }

  setUserEnabled(id: number, enabled: boolean): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}/status`, { enabled });
  }

  downloadLogs(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/logs/download`, { responseType: 'blob' });
  }

  tailLogs(lines = 500): Observable<ApiResponse<{ lines: string[]; totalLines: number }>> {
    const params = new HttpParams().set('lines', lines);
    return this.http.get<ApiResponse<{ lines: string[]; totalLines: number }>>(`${this.baseUrl}/logs/tail`, { params });
  }
}
