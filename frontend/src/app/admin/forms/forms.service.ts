import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { FormDefinition, CreateFormPayload, UpdateFormPayload, DuplicatePayload, PagedResult } from './form.model';

@Injectable({ providedIn: 'root' })
export class FormsService {
  private api = inject(ApiService);

  getAll(page = 1, pageSize = 20, search?: string): Observable<PagedResult<FormDefinition>> {
    return this.api.get<PagedResult<FormDefinition>>('/admin/forms', { page, pageSize, ...(search ? { search } : {}) });
  }

  getById(id: string): Observable<FormDefinition> {
    return this.api.get<FormDefinition>(`/admin/forms/${id}`);
  }

  create(data: CreateFormPayload): Observable<FormDefinition> {
    return this.api.post<FormDefinition>('/admin/forms', data);
  }

  update(id: string, data: UpdateFormPayload): Observable<FormDefinition> {
    return this.api.put<FormDefinition>(`/admin/forms/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/forms/${id}`);
  }

  publish(id: string): Observable<FormDefinition> {
    return this.api.post<FormDefinition>(`/admin/forms/${id}/publish`, {});
  }

  duplicate(id: string, data: DuplicatePayload): Observable<FormDefinition> {
    return this.api.post<FormDefinition>(`/admin/forms/${id}/duplicate`, data);
  }
}
