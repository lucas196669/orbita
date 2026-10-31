import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Impide que una sesión activa vuelva al inicio de sesión. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/app/inicio']);
};
