import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { MarkPayoutPaidRequest, Payout, PayoutStatusHistory, PayoutSummary } from '../models/payout.model';

@Injectable({ providedIn: 'root' })
export class PayoutService {

  private readonly adminUrl = `${environment.apiUrl}/admin/payouts`;
  private readonly businessUrl = `${environment.apiUrl}/business/payouts`;

  constructor(private http: HttpClient) {
  }

  // ---- Admin ----

  getAllPayouts(status?: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<Payout>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PageResponse<Payout>>>(this.adminUrl, { params });
  }

  getPayoutAsAdmin(id: number): Observable<ApiResponse<Payout>> {
    return this.http.get<ApiResponse<Payout>>(`${this.adminUrl}/${id}`);
  }

  getHistory(id: number): Observable<ApiResponse<PayoutStatusHistory[]>> {
    return this.http.get<ApiResponse<PayoutStatusHistory[]>>(`${this.adminUrl}/${id}/history`);
  }

  updateStatus(id: number, req: MarkPayoutPaidRequest): Observable<ApiResponse<Payout>> {
    return this.http.put<ApiResponse<Payout>>(`${this.adminUrl}/${id}/status`, req);
  }

  // ---- Business ----

  getOwnPayouts(status?: string, page = 0, size = 20): Observable<ApiResponse<PageResponse<Payout>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PageResponse<Payout>>>(this.businessUrl, { params });
  }

  getOwnSummary(): Observable<ApiResponse<PayoutSummary>> {
    return this.http.get<ApiResponse<PayoutSummary>>(`${this.businessUrl}/summary`);
  }

  getOwnPayout(id: number): Observable<ApiResponse<Payout>> {
    return this.http.get<ApiResponse<Payout>>(`${this.businessUrl}/${id}`);
  }

  getOwnHistory(id: number): Observable<ApiResponse<PayoutStatusHistory[]>> {
    return this.http.get<ApiResponse<PayoutStatusHistory[]>>(`${this.businessUrl}/${id}/history`);
  }

  raiseDispute(id: number, note: string): Observable<ApiResponse<Payout>> {
    return this.http.post<ApiResponse<Payout>>(`${this.businessUrl}/${id}/dispute`, { note });
  }
}
