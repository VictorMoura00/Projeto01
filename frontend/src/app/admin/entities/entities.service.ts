import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { EntityDefinition, EntityDefinitionWithFields, FieldDefinition, FieldType } from './entity.model';
import { Observable } from 'rxjs';

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class EntitiesService {
  private api = inject(ApiService);

  getAll(page = 1, pageSize = 20, search?: string): Observable<PagedResult<EntityDefinition>> {
    return this.api.get<PagedResult<EntityDefinition>>('/admin/entities', { page, pageSize, ...(search ? { search } : {}) });
  }

  getById(id: string): Observable<EntityDefinitionWithFields> {
    return this.api.get<EntityDefinitionWithFields>(`/admin/entities/${id}`);
  }

  create(data: { name: string; slug: string; description?: string; icon?: string }): Observable<EntityDefinition> {
    return this.api.post<EntityDefinition>('/admin/entities', data);
  }

  update(id: string, data: Partial<EntityDefinition>): Observable<EntityDefinition> {
    return this.api.put<EntityDefinition>(`/admin/entities/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/entities/${id}`);
  }

  createField(entityId: string, data: {
    name: string; slug: string; fieldType: FieldType;
    isRequired: boolean; isSearchable: boolean; isFilterable: boolean;
    defaultValue?: string; optionsJson?: string;
  }): Observable<FieldDefinition> {
    return this.api.post<FieldDefinition>(`/admin/entities/${entityId}/fields`, data);
  }

  updateField(entityId: string, fieldId: string, data: Partial<FieldDefinition>): Observable<FieldDefinition> {
    return this.api.put<FieldDefinition>(`/admin/entities/${entityId}/fields/${fieldId}`, data);
  }

  deleteField(entityId: string, fieldId: string): Observable<void> {
    return this.api.delete<void>(`/admin/entities/${entityId}/fields/${fieldId}`);
  }

  reorderFields(entityId: string, orderedFieldIds: string[]): Observable<void> {
    return this.api.put<void>(`/admin/entities/${entityId}/fields/reorder`, orderedFieldIds);
  }
}
