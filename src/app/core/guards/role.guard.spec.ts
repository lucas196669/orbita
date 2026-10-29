import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type ActivatedRouteSnapshot, type RouterStateSnapshot, UrlTree } from '@angular/router';

import type { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

import { roleGuard } from './role.guard';

function createRoute(roles?: readonly Role[]): ActivatedRouteSnapshot {
  return { data: roles ? { roles } : {} } as ActivatedRouteSnapshot;
}

function createAuthMock(role: Role | null): AuthService {
  return {
    role: () => role,
  } as unknown as AuthService;
}

describe('roleGuard', () => {
  it('allows an admin to enter a route reserved for admins', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: createAuthMock('admin') }],
    });

    const result = TestBed.runInInjectionContext(() => roleGuard(createRoute(['admin']), {} as RouterStateSnapshot));

    expect(result).toBe(true);
  });

  it('redirects a standard user to the access denied page', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: createAuthMock('user') }],
    });

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => roleGuard(createRoute(['admin']), {} as RouterStateSnapshot));

    expect(result instanceof UrlTree).toBe(true);

    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/acceso-denegado');
    }
  });

  it('redirects when the route has no allowed roles configured', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: createAuthMock('admin') }],
    });

    const result = TestBed.runInInjectionContext(() => roleGuard(createRoute(), {} as RouterStateSnapshot));

    expect(result instanceof UrlTree).toBe(true);
  });
});
