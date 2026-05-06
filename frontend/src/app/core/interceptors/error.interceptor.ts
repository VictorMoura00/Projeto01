import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = error.error?.message ?? error.message ?? 'Erro inesperado';

      if (error.status === 0) {
        messageService.add({ severity: 'error', summary: 'Sem conexão', detail: 'Não foi possível conectar ao servidor.' });
      } else if (error.status >= 500) {
        messageService.add({ severity: 'error', summary: 'Erro no servidor', detail: message });
      } else if (error.status === 403) {
        messageService.add({ severity: 'warn', summary: 'Sem permissão', detail: 'Você não tem permissão para esta ação.' });
      } else if (error.status === 404) {
        messageService.add({ severity: 'warn', summary: 'Não encontrado', detail: message });
      }

      return throwError(() => error);
    })
  );
};
