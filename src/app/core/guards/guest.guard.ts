import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Impide que un usuario autenticado vuelva a las pantallas de acceso.
 *
 * @returns `true` para invitados o un `UrlTree` hacia `/app/inicio`.
 */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  return auth.isAuthenticated() ? router.createUrlTree(['/app/inicio']) : true;
};
