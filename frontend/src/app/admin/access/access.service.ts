import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AppRole, RolePermission } from './access.model';

interface PagedList<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class AccessService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/roles`;

  getAll(page = 1, pageSize = 20) {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedList<AppRole>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<AppRole>(`${this.base}/${id}`);
  }

  create(data: { name: string; description: string | null }) {
    return this.http.post<AppRole>(this.base, data);
  }

  update(id: string, data: { name: string; description: string | null; isActive: boolean }) {
    return this.http.put<AppRole>(`${this.base}/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  setPermissions(id: string, permissions: { entitySlug: string; operations: number }[]) {
    return this.http.put<AppRole>(`${this.base}/${id}/permissions`, { permissions });
  }
}
