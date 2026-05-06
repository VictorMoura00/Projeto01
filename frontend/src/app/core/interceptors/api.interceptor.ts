import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const accessToken = auth.accessToken();
  const isAbsolute = req.url.startsWith('http');
  const url = isAbsolute ? req.url : `${environment.apiUrl}${req.url}`;
  const isRefreshRequest = req.url.includes('/auth/refresh');

  const apiReq = req.clone({
    url,
    setHeaders: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isRefreshRequest || !auth.refreshToken()) {
        return throwError(() => error);
      }

      return auth.refreshSession().pipe(
        switchMap(result => next(apiReq.clone({
          setHeaders: { Authorization: `Bearer ${result.accessToken}` }
        }))),
        catchError(refreshError => {
          auth.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
