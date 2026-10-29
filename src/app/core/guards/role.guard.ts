import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import type { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/** Exige que el rol actual esté incluido en `route.data.roles`. */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = readRoles((route.data as Record<string, unknown>)['roles']);
  const role = auth.role();

  if (role !== null && allowedRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};

function readRoles(value: unknown): readonly Role[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is Role => entry === 'admin' || entry === 'user');
}
