import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Tenant, TenantTheme } from './white-label.model';

interface PagedList<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class WhiteLabelService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/tenants`;

  getAll(page = 1, pageSize = 20) {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedList<Tenant>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<Tenant>(`${this.base}/${id}`);
  }

  create(data: { name: string; slug: string }) {
    return this.http.post<Tenant>(this.base, data);
  }

  update(id: string, data: { name: string; logoUrl: string | null; faviconUrl: string | null; isActive: boolean }) {
    return this.http.put<Tenant>(`${this.base}/${id}`, data);
  }

  updateTheme(id: string, theme: TenantTheme) {
    return this.http.put<Tenant>(`${this.base}/${id}/theme`, theme);
  }
}
