import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const auth401Interceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const token = auth.token();
        const current = router.url;
        const isLogin = current === '/login' || current.startsWith('/login');
        const isLogoutRequest = req.url.includes('/auth/logout');
        if (token && !isLogin && !isLogoutRequest) {
          auth.logout();
        }
      }
      return throwError(() => err);
    })
  );
};
