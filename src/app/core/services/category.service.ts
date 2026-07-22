import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Category, CategoryRequest } from '../models/category.model';

/**
 * Provides access to product categories.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {

  private readonly baseUrl = `${environment.apiUrl}/categories`;
  private readonly adminUrl = `${environment.apiUrl}/admin/categories`;

  constructor(private http: HttpClient) {
  }

  getActiveCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.baseUrl);
  }

  getCategory(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.baseUrl}/${id}`);
  }

  getAllCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.adminUrl);
  }

  createCategory(request: CategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.adminUrl, request);
  }

  updateCategory(id: number, request: CategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.adminUrl}/${id}`, request);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.adminUrl}/${id}`);
  }
}
