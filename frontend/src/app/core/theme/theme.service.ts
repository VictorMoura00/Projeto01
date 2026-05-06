import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, EMPTY, tap } from 'rxjs';
import { TenantConfig, TenantTheme } from './tenant-config.model';
import { TenantConfigService } from './tenant-config.service';

const TENANT_SLUG_KEY = 'admincore.tenantSlug';
const TENANT_CONFIG_KEY = 'admincore.tenantConfig';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);
  private tenantConfigService = inject(TenantConfigService);

  tenantConfig = signal<TenantConfig | null>(this.loadStoredConfig());

  applyStoredTheme(): void {
    const stored = this.tenantConfig();
    if (stored) this.applyTheme(stored.theme);
  }

  loadTenantTheme(slug?: string | null): void {
    const resolvedSlug = slug ?? localStorage.getItem(TENANT_SLUG_KEY);
    if (!resolvedSlug) {
      this.applyStoredTheme();
      return;
    }

    this.tenantConfigService.getPublicConfig(resolvedSlug).pipe(
      tap(config => {
        localStorage.setItem(TENANT_SLUG_KEY, config.slug);
        localStorage.setItem(TENANT_CONFIG_KEY, JSON.stringify(config));
        this.tenantConfig.set(config);
        this.applyTheme(config.theme);
      }),
      catchError(() => {
        this.applyStoredTheme();
        return EMPTY;
      })
    ).subscribe();
  }

  private applyTheme(theme: TenantTheme): void {
    const root = this.document.documentElement;
    root.style.setProperty('--p-primary-color', theme.primaryColor);
    root.style.setProperty('--p-primary-500', theme.primaryColor);
    root.style.setProperty('--app-sidebar-active', theme.accentColor);
    root.style.setProperty('--app-panel-bg', theme.surfaceColor);
    root.style.setProperty('--app-shell-bg', theme.surfaceColor);
    root.style.setProperty('font-family', theme.fontFamily);
  }

  private loadStoredConfig(): TenantConfig | null {
    const raw = localStorage.getItem(TENANT_CONFIG_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as TenantConfig;
    } catch {
      localStorage.removeItem(TENANT_CONFIG_KEY);
      return null;
    }
  }
}
