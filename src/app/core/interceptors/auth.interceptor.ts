import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Añade el token de Supabase y cierra la sesión ante un 401. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.session()?.access_token;
  const isSupabaseRequest = environment.supabaseUrl.length > 0 && request.url.startsWith(environment.supabaseUrl);

  const authorizedRequest =
    isSupabaseRequest && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        void auth.logout().finally(() => {
          void router.navigate(['/login']);
        });
      }

      return throwError(() => error);
    }),
  );
};
