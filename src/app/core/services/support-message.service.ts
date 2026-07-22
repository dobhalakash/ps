import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SendSupportMessageRequest, SupportMessage, SupportThreadSummary } from '../models/support-message.model';

@Injectable({ providedIn: 'root' })
export class SupportMessageService {

  private readonly businessUrl = `${environment.apiUrl}/business/support/messages`;
  private readonly adminUrl = `${environment.apiUrl}/admin/support/messages`;

  constructor(private http: HttpClient) {
  }

  // ---- Business admin ----

  getOwnThread(): Observable<ApiResponse<SupportMessage[]>> {
    return this.http.get<ApiResponse<SupportMessage[]>>(this.businessUrl);
  }

  sendAsBusiness(request: SendSupportMessageRequest): Observable<ApiResponse<SupportMessage>> {
    return this.http.post<ApiResponse<SupportMessage>>(this.businessUrl, request);
  }

  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.businessUrl}/unread-count`);
  }

  // ---- Platform admin ----

  getInbox(): Observable<ApiResponse<SupportThreadSummary[]>> {
    return this.http.get<ApiResponse<SupportThreadSummary[]>>(`${this.adminUrl}/inbox`);
  }

  getThreadAsAdmin(businessUserId: number): Observable<ApiResponse<SupportMessage[]>> {
    return this.http.get<ApiResponse<SupportMessage[]>>(`${this.adminUrl}/${businessUserId}`);
  }

  sendAsAdmin(businessUserId: number, request: SendSupportMessageRequest): Observable<ApiResponse<SupportMessage>> {
    return this.http.post<ApiResponse<SupportMessage>>(`${this.adminUrl}/${businessUserId}`, request);
  }
}
