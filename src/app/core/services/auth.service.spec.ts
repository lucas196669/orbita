import { TestBed } from '@angular/core/testing';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

function createSession(): Session {
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      id: 'user-1',
      email: 'ana@example.com',
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Ana' },
      aud: 'authenticated',
      created_at: new Date(0).toISOString(),
    },
  } as unknown as Session;
}

function createSupabaseMock() {
  const maybeSingle = vi.fn();
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }));
  const from = vi.fn(() => ({ select }));
  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  };
  const client = { auth, from } as unknown as SupabaseClient;

  return { client, auth, from, select, maybeSingle };
}

describe('AuthService', () => {
  let supabase: ReturnType<typeof createSupabaseMock>;
  let service: AuthService;

  beforeEach(() => {
    supabase = createSupabaseMock();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });

    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client: supabase.client } }],
    });

    service = TestBed.inject(AuthService);
  });

  it('initializes without a session when Supabase returns null', async () => {
    await service.init();

    expect(service.initialized()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBeNull();
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it('loads the session and the role from the profiles table', async () => {
    const session = createSession();
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    supabase.maybeSingle.mockResolvedValue({
      data: { role: 'admin', full_name: 'Ana Admin' },
      error: null,
    });

    await service.init();

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(service.initialized()).toBe(true);
    expect(service.session()).toBe(session);
    expect(service.user()).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      fullName: 'Ana Admin',
      role: 'admin',
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
  });

  it('falls back to the user role for unknown database values', async () => {
    const session = createSession();
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    supabase.maybeSingle.mockResolvedValue({
      data: { role: 'owner', full_name: null },
      error: null,
    });

    await service.init();

    expect(service.role()).toBe('user');
    expect(service.isAdmin()).toBe(false);
  });

  it('logs in, loads the profile and exposes the authenticated user', async () => {
    const session = createSession();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session, user: session.user },
      error: null,
    });
    supabase.maybeSingle.mockResolvedValue({
      data: { role: 'admin', full_name: 'Ana Admin' },
      error: null,
    });

    const result = await service.login(' ana@example.com ', 'mock-password');

    expect(result).toEqual({ ok: true });
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'mock-password',
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.role()).toBe('admin');
    expect(service.loading()).toBe(false);
  });

  it('translates invalid credentials without exposing the technical message', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: {
        name: 'AuthApiError',
        message: 'Invalid login credentials',
        status: 400,
        code: 'invalid_credentials',
      },
    });

    const result = await service.login('ana@example.com', 'wrong-password');

    if (result.ok) {
      throw new Error('Login should have failed');
    }

    expect(result.message).toBe('Correo o contraseña incorrectos.');
    expect(JSON.stringify(result)).not.toContain('Invalid login credentials');
  });

  it('signs out when the account has no profile row', async () => {
    const session = createSession();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session, user: session.user },
      error: null,
    });
    supabase.maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await service.login('ana@example.com', 'mock-password');

    expect(result).toEqual({ ok: false, message: 'Tu cuenta no tiene un perfil configurado.' });
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the session on logout', async () => {
    const session = createSession();
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    supabase.maybeSingle.mockResolvedValue({
      data: { role: 'admin', full_name: 'Ana Admin' },
      error: null,
    });

    await service.init();
    await service.logout();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(service.session()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.role()).toBeNull();
  });
});
