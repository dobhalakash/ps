import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface DeliveryCheckResult {
  /** true/false = known answer; null = checker unavailable (e.g. courier API not configured). */
  available: boolean | null;
  estimatedDays?: number;
  courierName?: string;
}

@Injectable({ providedIn: 'root' })
export class ShippingService {

  constructor(private http: HttpClient) {
  }

  /** Public pincode delivery availability + estimated days. */
  checkDelivery(pincode: string): Observable<ApiResponse<DeliveryCheckResult>> {
    return this.http.get<ApiResponse<DeliveryCheckResult>>(
      `${environment.apiUrl}/public/delivery-check`, { params: { pincode } });
  }
}
