import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SystemParameter, PagedList } from './parameter.model';

@Injectable({ providedIn: 'root' })
export class ParametersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/admin/parameters`;

  getAll(group?: string, page = 1, pageSize = 50) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (group) params = params.set('group', group);
    return this.http.get<PagedList<SystemParameter>>(this.base, { params });
  }

  create(data: Omit<SystemParameter, 'id' | 'createdAt'>) {
    return this.http.post<SystemParameter>(this.base, data);
  }

  update(id: string, value: string, description: string | null) {
    return this.http.put<SystemParameter>(`${this.base}/${id}`, { value, description });
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
