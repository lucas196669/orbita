import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protege rutas privadas: sin sesión redirige a `/login` conservando el destino.
 *
 * @param _route Ruta activada.
 * @param state Estado de navegación con la URL solicitada.
 * @returns `true` si hay sesión o un `UrlTree` de redirección.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  return auth.isAuthenticated() ? true : router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
};
