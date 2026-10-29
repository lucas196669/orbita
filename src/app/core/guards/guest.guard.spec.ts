import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type ActivatedRouteSnapshot, type RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { guestGuard } from './guest.guard';

function createAuthMock(authenticated: boolean): AuthService {
  return {
    isAuthenticated: () => authenticated,
  } as unknown as AuthService;
}

describe('guestGuard', () => {
  it('allows access to login when there is no session', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: createAuthMock(false) }],
    });

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects an authenticated user to the home page', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: createAuthMock(true) }],
    });

    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result instanceof UrlTree).toBe(true);

    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/app/inicio');
    }
  });
});
