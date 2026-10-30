import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type ActivatedRouteSnapshot, type RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { authGuard } from './auth.guard';

function createAuthMock(authenticated: boolean): AuthService {
  return {
    isAuthenticated: () => authenticated,
  } as unknown as AuthService;
}

describe('authGuard', () => {
  it('allows navigation when there is an authenticated user', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: createAuthMock(true) }],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/app/dashboard' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects to login and keeps the return url when there is no session', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: createAuthMock(false) }],
    });

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/app/dashboard' } as RouterStateSnapshot),
    );

    expect(result instanceof UrlTree).toBe(true);

    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fapp%2Fdashboard');
    }
  });
});
