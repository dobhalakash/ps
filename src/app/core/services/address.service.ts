import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Address, AddressRequest } from '../models/address.model';

/**
 * Manages the authenticated user's saved addresses.
 */
@Injectable({ providedIn: 'root' })
export class AddressService {

  private readonly baseUrl = `${environment.apiUrl}/addresses`;

  constructor(private http: HttpClient) {
  }

  getAddresses(): Observable<ApiResponse<Address[]>> {
    return this.http.get<ApiResponse<Address[]>>(this.baseUrl);
  }

  getAddress(id: number): Observable<ApiResponse<Address>> {
    return this.http.get<ApiResponse<Address>>(`${this.baseUrl}/${id}`);
  }

  createAddress(request: AddressRequest): Observable<ApiResponse<Address>> {
    return this.http.post<ApiResponse<Address>>(this.baseUrl, request);
  }

  updateAddress(id: number, request: AddressRequest): Observable<ApiResponse<Address>> {
    return this.http.put<ApiResponse<Address>>(`${this.baseUrl}/${id}`, request);
  }

  deleteAddress(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
