import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import type { AuthError, Session } from '@supabase/supabase-js';

import type { AppUser, Role } from '../models/user.model';

import { FirestoreActivityService } from './firestore-activity.service';
import { SupabaseService } from './supabase.service';

/** Resultado de un intento de inicio de sesión. */
export type AuthResult = { readonly ok: true } | { readonly ok: false; readonly message: string };

/** Resultado del alta de una cuenta. */
export interface SignUpOutcome {
  /** Indica si el alta ha dejado una sesión activa. */
  readonly hasSession: boolean;
}

interface ProfileRow {
  readonly role: string | null;
  readonly full_name: string | null;
}

/**
 * Store de autenticación de Orbita.
 *
 * Mantiene la sesión y el usuario como signals, carga el rol desde la tabla
 * `profiles` y expone estado derivado para guards, layout y vistas.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly supabase = this.supabaseService.client;
  private readonly destroyRef = inject(DestroyRef);
  private readonly activity = inject(FirestoreActivityService, { optional: true });

  private readonly sessionState = signal<Session | null>(null);
  private readonly userState = signal<AppUser | null>(null);
  private readonly loadingState = signal(false);
  private readonly initializedState = signal(false);

  private initPromise: Promise<void> | null = null;
  private unsubscribe: (() => void) | null = null;
  private sessionVersion = 0;

  /** Sesión actual de Supabase. */
  readonly session = this.sessionState.asReadonly();
  /** Usuario de aplicación con su rol. */
  readonly user = this.userState.asReadonly();
  /** Alias del perfil público del usuario autenticado. */
  readonly profile = this.userState.asReadonly();
  /** Indica si hay una operación de autenticación en curso. */
  readonly loading = this.loadingState.asReadonly();
  /** Indica si la sesión inicial ya se ha resuelto. */
  readonly initialized = this.initializedState.asReadonly();
  /** Hay sesión y perfil válidos. */
  readonly isAuthenticated = computed(() => this.sessionState() !== null && this.userState() !== null);
  /** Rol actual o `null` si no hay usuario cargado. */
  readonly role = computed<Role | null>(() => this.userState()?.role ?? null);
  /** El usuario actual es administrador. */
  readonly isAdmin = computed(() => this.role() === 'admin');

  constructor() {
    this.destroyRef.onDestroy(() => this.unsubscribe?.());
  }

  /**
   * Restaura la sesión, carga el rol y escucha cambios de autenticación.
   * Se ejecuta como inicializador de la aplicación.
   *
   * @returns Promesa resuelta cuando la sesión inicial está lista.
   */
  init(): Promise<void> {
    this.initPromise ??= this.bootstrap();
    return this.initPromise;
  }

  /** Espera a que la sesión inicial esté resuelta. */
  async ready(): Promise<void> {
    await this.init();
  }

  /**
   * Inicia sesión con correo y contraseña.
   *
   * @param email Correo introducido por la persona usuaria.
   * @param password Contraseña introducida por la persona usuaria.
   * @returns Resultado con un mensaje de usuario en español si falla.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    this.loadingState.set(true);

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { ok: false, message: this.toUserMessage(error) };
      }

      if (!data.session) {
        return {
          ok: false,
          message: 'Revisa tu correo electrónico para confirmar la cuenta antes de entrar.',
        };
      }

      await this.applySession(data.session);

      if (!this.userState()) {
        await this.supabase.auth.signOut().catch(() => undefined);
        this.clearSession();
        return { ok: false, message: 'Tu cuenta no tiene un perfil configurado.' };
      }

      this.recordActivity('Inicio de sesión', data.session.user.email ?? 'Usuario');

      return { ok: true };
    } catch {
      return { ok: false, message: 'No hemos podido iniciar sesión. Inténtalo de nuevo.' };
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Inicia sesión y lanza un error si las credenciales no son válidas.
   *
   * @param email Correo electrónico.
   * @param password Contraseña.
   */
  async signIn(email: string, password: string): Promise<void> {
    const result = await this.login(email, password);

    if (!result.ok) {
      throw new Error(result.message);
    }
  }

  /**
   * Crea una cuenta y actualiza el estado de sesión.
   *
   * @param fullName Nombre completo del usuario.
   * @param email Correo electrónico.
   * @param password Contraseña.
   * @returns Resultado con la existencia de sesión.
   */
  async signUp(fullName: string, email: string, password: string): Promise<SignUpOutcome> {
    const result = await this.supabaseService.signUp(fullName, email, password);
    await this.applySession(result.session);

    return { hasSession: result.session !== null };
  }

  /**
   * Garantiza que la sesión y el perfil estén cargados.
   *
   * @returns Perfil actual o `null` si no hay sesión.
   */
  async ensureProfile(): Promise<AppUser | null> {
    await this.init();
    return this.userState();
  }

  /** Cierra la sesión y limpia el estado local. */
  async logout(): Promise<void> {
    this.loadingState.set(true);

    try {
      await this.supabase.auth.signOut();
    } catch {
      this.clearSession();
    }

    this.clearSession();
    this.loadingState.set(false);
  }

  /** Alias de cierre de sesión usado por las vistas de la fase 2. */
  async signOut(): Promise<void> {
    await this.logout();
  }

  private async bootstrap(): Promise<void> {
    this.loadingState.set(true);

    try {
      const { data, error } = await this.supabase.auth.getSession();
      this.watchAuthChanges();

      if (error) {
        this.clearSession();
      } else {
        await this.applySession(data.session);
      }
    } catch {
      this.clearSession();
    } finally {
      this.loadingState.set(false);
      this.initializedState.set(true);
    }
  }

  private watchAuthChanges(): void {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) => {
      void Promise.resolve()
        .then(() => this.applySession(session))
        .catch(() => undefined);
    });

    this.unsubscribe = () => data.subscription.unsubscribe();
  }

  private async applySession(session: Session | null): Promise<void> {
    const version = ++this.sessionVersion;
    this.sessionState.set(session);

    if (!session) {
      this.userState.set(null);
      return;
    }

    const user = await this.loadProfile(session);

    if (version !== this.sessionVersion) {
      return;
    }

    this.userState.set(user);
  }

  private async loadProfile(session: Session): Promise<AppUser | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .maybeSingle<ProfileRow>();

    if (error || !data) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email ?? '',
      fullName: data.full_name,
      role: this.normalizeRole(data.role),
    };
  }

  private recordActivity(action: string, actor: string, detail?: string): void {
    if (!this.activity) {
      return;
    }

    void this.activity.log(action, actor, detail).catch(() => undefined);
  }

  private normalizeRole(value: string | null): Role {
    return value === 'admin' ? 'admin' : 'user';
  }

  private clearSession(): void {
    this.sessionVersion += 1;
    this.sessionState.set(null);
    this.userState.set(null);
  }

  private toUserMessage(error: AuthError): string {
    const code = error.code ?? '';
    const status = error.status;

    if (code === 'email_not_confirmed') {
      return 'Debes confirmar tu correo electrónico antes de entrar.';
    }

    if (code === 'invalid_credentials' || code === 'invalid_grant' || status === 400) {
      return 'Correo o contraseña incorrectos.';
    }

    if (status === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') {
      return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    }

    if (status === undefined) {
      return 'No hemos podido conectar con el servidor. Revisa tu conexión.';
    }

    return 'No hemos podido iniciar sesión. Inténtalo de nuevo.';
  }
}
