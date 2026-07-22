import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { News, NewsRequest } from '../models/news.model';

/**
 * Manages news/announcement content.
 */
@Injectable({ providedIn: 'root' })
export class NewsService {

  private readonly baseUrl = `${environment.apiUrl}/news`;
  private readonly adminUrl = `${environment.apiUrl}/admin/news`;

  constructor(private http: HttpClient) {
  }

  getPublishedNews(category?: string, page = 0, size = 10): Observable<ApiResponse<PageResponse<News>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<ApiResponse<PageResponse<News>>>(this.baseUrl, { params });
  }

  getNews(id: number): Observable<ApiResponse<News>> {
    return this.http.get<ApiResponse<News>>(`${this.baseUrl}/${id}`);
  }

  // ---- Admin management ----

  getAllNews(): Observable<ApiResponse<News[]>> {
    return this.http.get<ApiResponse<News[]>>(this.adminUrl);
  }

  createNews(request: NewsRequest): Observable<ApiResponse<News>> {
    return this.http.post<ApiResponse<News>>(this.adminUrl, request);
  }

  updateNews(id: number, request: NewsRequest): Observable<ApiResponse<News>> {
    return this.http.put<ApiResponse<News>>(`${this.adminUrl}/${id}`, request);
  }

  deleteNews(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.adminUrl}/${id}`);
  }
}
