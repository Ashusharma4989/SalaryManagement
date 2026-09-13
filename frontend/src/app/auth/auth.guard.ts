import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export function authGuard(roles: string[] = []): CanActivateFn {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (roles.length > 0 && !auth.hasRole(...roles)) {
      router.navigate(['/']);
      return false;
    }

    return true;
  };
}
