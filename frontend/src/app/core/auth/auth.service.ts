import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResult, LoginRequest, RefreshTokenRequest, UserSession } from './auth.model';

const ACCESS_TOKEN_KEY = 'admincore.accessToken';
const REFRESH_TOKEN_KEY = 'admincore.refreshToken';
const USER_KEY = 'admincore.user';
const TENANT_SLUG_KEY = 'admincore.tenantSlug';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private accessTokenState = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private refreshTokenState = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private userState = signal<UserSession | null>(this.loadUser());

  accessToken = this.accessTokenState.asReadonly();
  refreshToken = this.refreshTokenState.asReadonly();
  user = this.userState.asReadonly();
  isAuthenticated = computed(() => !!this.accessTokenState());

  login(request: LoginRequest, tenantSlug?: string): Observable<AuthResult> {
    return this.http.post<AuthResult>('/auth/login', request).pipe(
      tap(result => {
        if (tenantSlug) localStorage.setItem(TENANT_SLUG_KEY, tenantSlug);
        this.storeSession(result);
      })
    );
  }

  refreshSession(): Observable<AuthResult> {
    const refreshToken = this.refreshTokenState();
    if (!refreshToken) throw new Error('Refresh token ausente.');

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResult>('/auth/refresh', request).pipe(
      tap(result => this.storeSession(result))
    );
  }

  logout(redirect = true): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
    this.userState.set(null);

    if (redirect) {
      const tenantSlug = localStorage.getItem(TENANT_SLUG_KEY);
      this.router.navigate(tenantSlug ? ['/', tenantSlug, 'login'] : ['/login']);
    }
  }

  getTenantSlug(): string | null {
    return localStorage.getItem(TENANT_SLUG_KEY);
  }

  private storeSession(result: AuthResult): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.accessTokenState.set(result.accessToken);
    this.refreshTokenState.set(result.refreshToken);
    this.userState.set(result.user);
  }

  private loadUser(): UserSession | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
