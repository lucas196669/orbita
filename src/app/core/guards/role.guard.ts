import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import type { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Comprueba que el usuario tenga uno de los roles declarados en `route.data.roles`.
 *
 * @param route Ruta activada con `data.roles`.
 * @returns `true` si el rol está permitido o un `UrlTree` de redirección.
 */
export const roleGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const requiredRoles = readRoles(route.data['roles']);

  if (requiredRoles.length === 0) {
    return true;
  }

  const profile = await auth.ensureProfile();
  const role = profile?.role ?? 'user';

  return requiredRoles.includes(role) ? true : router.createUrlTree(['/app/productos']);
};

function readRoles(value: unknown): UserRole[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((role): role is UserRole => role === 'admin' || role === 'user');
}
