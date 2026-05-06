import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantConfig } from './tenant-config.model';

@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private http = inject(HttpClient);

  getPublicConfig(slug: string): Observable<TenantConfig> {
    return this.http.get<TenantConfig>(`/tenants/${slug}/config`);
  }
}
