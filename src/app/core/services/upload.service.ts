import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UploadService {

  private readonly baseUrl = `${environment.apiUrl}/uploads`;

  constructor(private http: HttpClient) {
  }

  /** Uploads an image file and returns its publicly-accessible URL (relative, e.g. /uploads/products/xyz.jpg). */
  uploadImage(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>(`${this.baseUrl}/image`, formData);
  }

  /** Uploads a short product video (MP4/WebM/MOV, max 50MB) and returns its URL. */
  uploadVideo(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>(`${this.baseUrl}/video`, formData);
  }

  /** Uploads a customer review photo (any logged-in user, max 3MB). */
  uploadReviewImage(file: File): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string }>>(`${this.baseUrl}/review-image`, formData);
  }

  /** Uploads a general document/image attachment and returns its URL + original filename. */
  uploadDocument(file: File): Observable<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ url: string; filename: string }>>(`${this.baseUrl}/document`, formData);
  }

  /** Resolves a possibly-relative upload URL (e.g. "/uploads/products/x.jpg") into a full URL for <img src>. */
  resolveUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // environment.apiUrl ends with "/api" - uploaded files are served one level up, at the host root.
    const apiOrigin = environment.apiUrl.replace(/\/api\/?$/, '');
    return apiOrigin + url;
  }
}
