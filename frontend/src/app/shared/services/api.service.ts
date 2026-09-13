import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.get<T>(path, { params: this.toParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(path, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(path, body);
  }

  patch<T>(path: string, body: unknown = null): Observable<T> {
    return this.http.patch<T>(path, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(path);
  }

  list<T>(path: string, params?: Record<string, unknown>): Observable<PagedResponse<T>> {
    return this.http.get<PagedResponse<T>>(path, { params: this.toParams(params) });
  }

  private toParams(params?: Record<string, unknown>): HttpParams {
    let result = new HttpParams();
    if (!params) {
      return result;
    }
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined || value === '') {
        continue;
      }
      result = result.append(key, String(value));
    }
    return result;
  }
}
