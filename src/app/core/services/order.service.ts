import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { CheckoutRequest, ManualShipmentRequest, Order, RazorpayOrderInfo, Shipment, UpdateOrderStatusRequest, UpiPaymentInfo, VerifyPaymentRequest } from '../models/order.model';

/**
 * Manages order placement and history.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {

  private readonly baseUrl = `${environment.apiUrl}/orders`;
  private readonly businessUrl = `${environment.apiUrl}/business/orders`;
  private readonly adminUrl = `${environment.apiUrl}/admin/orders`;

  constructor(private http: HttpClient) {
  }

  checkout(request: CheckoutRequest): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/checkout`, request);
  }

  getMyOrders(page = 0, size = 10): Observable<ApiResponse<PageResponse<Order>>> {
    return this.http.get<ApiResponse<PageResponse<Order>>>(this.baseUrl, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  getOrder(id: number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/${id}`);
  }

  getUpiPaymentInfo(id: number): Observable<ApiResponse<UpiPaymentInfo>> {
    return this.http.get<ApiResponse<UpiPaymentInfo>>(`${this.baseUrl}/${id}/upi-payment`);
  }

  confirmPayment(id: number): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/${id}/confirm-payment`, {});
  }

  createRazorpayOrder(id: number): Observable<ApiResponse<RazorpayOrderInfo>> {
    return this.http.post<ApiResponse<RazorpayOrderInfo>>(`${this.baseUrl}/${id}/razorpay-order`, {});
  }

  verifyPayment(id: number, request: VerifyPaymentRequest): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/${id}/verify-payment`, request);
  }

  downloadInvoice(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/invoice`, { responseType: 'blob' });
  }

  cancelOrder(id: number, reason: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/${id}/cancel`, { reason });
  }

  requestReturn(id: number, reason: string): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/${id}/return-request`, { reason });
  }

  decideReturnAsBusiness(id: number, approve: boolean): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.businessUrl}/${id}/return-decision`, {}, {
      params: new HttpParams().set('approve', approve)
    });
  }

  decideReturnAsAdmin(id: number, approve: boolean): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.adminUrl}/${id}/return-decision`, {}, {
      params: new HttpParams().set('approve', approve)
    });
  }

  // ---- Business admin ----

  getBusinessOrders(page = 0, size = 10): Observable<ApiResponse<PageResponse<Order>>> {
    return this.http.get<ApiResponse<PageResponse<Order>>>(this.businessUrl, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  updateOrderStatusAsBusiness(id: number, request: UpdateOrderStatusRequest): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.businessUrl}/${id}/status`, request);
  }

  createShiprocketShipmentAsBusiness(id: number): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(`${this.businessUrl}/${id}/shipment/shiprocket`, {});
  }

  saveManualShipmentAsBusiness(id: number, request: ManualShipmentRequest): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(`${this.businessUrl}/${id}/shipment/manual`, request);
  }

  refreshShipmentAsBusiness(id: number): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(`${this.businessUrl}/${id}/shipment/refresh`, {});
  }

  // ---- Super admin ----

  getAllOrders(page = 0, size = 10): Observable<ApiResponse<PageResponse<Order>>> {
    return this.http.get<ApiResponse<PageResponse<Order>>>(this.adminUrl, {
      params: new HttpParams().set('page', page).set('size', size)
    });
  }

  updateOrderStatusAsAdmin(id: number, request: UpdateOrderStatusRequest): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.adminUrl}/${id}/status`, request);
  }

  createShiprocketShipmentAsAdmin(id: number): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(`${this.adminUrl}/${id}/shipment/shiprocket`, {});
  }

  saveManualShipmentAsAdmin(id: number, request: ManualShipmentRequest): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(`${this.adminUrl}/${id}/shipment/manual`, request);
  }

  refreshShipmentAsAdmin(id: number): Observable<ApiResponse<Shipment>> {
    return this.http.post<ApiResponse<Shipment>>(`${this.adminUrl}/${id}/shipment/refresh`, {});
  }

  searchSupportOrders(query: string): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${environment.apiUrl}/admin/support/orders`, {
      params: new HttpParams().set('q', query)
    });
  }
}
