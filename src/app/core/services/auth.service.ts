import { computed, inject, Injectable, NgZone, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';

import type { UserProfile, UserRole } from '../models/user.model';

import { SupabaseService } from './supabase.service';

/** Resultado del alta de una cuenta. */
export interface SignUpOutcome {
  /** Indica si el alta ha dejado una sesión activa. */
  readonly hasSession: boolean;
}

/**
 * Estado global de autenticación basado en signals.
 *
 * Mantiene la sesión, el perfil y el rol efectivo, y expone operaciones de
 * acceso. El rol siempre procede de la base de datos, nunca del cliente.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly zone = inject(NgZone);
  private readonly sessionState = signal<Session | null>(null);
  private readonly profileState = signal<UserProfile | null>(null);
  private readonly readyPromise: Promise<void>;

  /** Sesión actual de Supabase. */
  readonly session = this.sessionState.asReadonly();

  /** Perfil del usuario autenticado. */
  readonly profile = this.profileState.asReadonly();

  /** Usuario de Supabase Auth. */
  readonly user = computed<User | null>(() => this.sessionState()?.user ?? null);

  /** Rol efectivo del usuario. Los invitados se consideran `user`. */
  readonly role = computed<UserRole>(() => this.profileState()?.role ?? 'user');

  /** Indica si hay una sesión activa. */
  readonly isAuthenticated = computed(() => this.sessionState() !== null);

  constructor() {
    this.readyPromise = this.initialize();
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.zone.run(() => {
        void this.applySession(session);
      });
    });
  }

  /** Espera a que se restaure la sesión inicial. */
  async ready(): Promise<void> {
    await this.readyPromise;
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
    const result = await this.supabase.signUp(fullName, email, password);
    await this.applySession(result.session);

    return { hasSession: result.session !== null };
  }

  /**
   * Inicia sesión y actualiza el estado global.
   *
   * @param email Correo electrónico.
   * @param password Contraseña.
   */
  async signIn(email: string, password: string): Promise<void> {
    const session = await this.supabase.signIn(email, password);
    await this.applySession(session);
  }

  /** Cierra la sesión actual y limpia el estado. */
  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.sessionState.set(null);
    this.profileState.set(null);
  }

  /**
   * Garantiza que el perfil esté cargado para comprobar roles.
   *
   * @returns Perfil actual o `null` si no hay sesión.
   */
  async ensureProfile(): Promise<UserProfile | null> {
    await this.ready();

    const session = this.sessionState();

    if (!session) {
      return null;
    }

    if (this.profileState()) {
      return this.profileState();
    }

    const profile = await this.loadProfile(session);
    this.profileState.set(profile);

    return profile;
  }

  private async initialize(): Promise<void> {
    try {
      const session = await this.supabase.getSession();
      await this.applySession(session);
    } catch {
      this.sessionState.set(null);
      this.profileState.set(null);
    }
  }

  private async applySession(session: Session | null): Promise<void> {
    this.sessionState.set(session);

    if (!session) {
      this.profileState.set(null);
      return;
    }

    this.profileState.set(await this.loadProfile(session));
  }

  private async loadProfile(session: Session): Promise<UserProfile | null> {
    try {
      return await this.supabase.getProfile(session.user.id);
    } catch {
      return null;
    }
  }
}
