import { Injectable } from '@angular/core';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';
import type { UserProfile, UserRole } from '../models/user.model';

/** Fila de la tabla `profiles` tal y como llega de Supabase. */
interface ProfileRow {
  readonly id: string;
  readonly email: string | null;
  readonly full_name: string | null;
  readonly role: string | null;
}

/** Resultado del alta de un usuario. */
export interface SignUpResult {
  /** Sesión creada cuando la confirmación por correo está desactivada. */
  readonly session: Session | null;
}

/**
 * Cliente de Supabase y operaciones transversales de autenticación y validación.
 *
 * Las credenciales se leen de `environment`; si siguen siendo marcadores se usa
 * una URL de reserva para que la aplicación pueda arrancar sin secretos.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** Cliente compartido de Supabase. */
  readonly client: SupabaseClient;

  /** Indica si el entorno tiene credenciales reales configuradas. */
  readonly isConfigured: boolean;

  constructor() {
    const hasUrl = !environment.supabaseUrl.startsWith('PEGAR_AQUI');
    const hasKey = !environment.supabaseKey.startsWith('PEGAR_AQUI');

    this.isConfigured = hasUrl && hasKey;

    this.client = createClient(
      hasUrl ? environment.supabaseUrl : 'https://placeholder.supabase.co',
      hasKey ? environment.supabaseKey : 'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  }

  /**
   * Comprueba si un correo ya está registrado mediante la función RPC.
   *
   * @param email Correo a comprobar.
   * @returns `true` si existe una cuenta asociada.
   */
  async emailExists(email: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('email_exists', {
      p_email: email.trim().toLowerCase(),
    });

    if (error) {
      throw error;
    }

    return data === true;
  }

  /**
   * Comprueba si un nombre de producto ya existe mediante la función RPC.
   *
   * @param name Nombre a comprobar.
   * @returns `true` si existe un producto con ese nombre.
   */
  async productNameExists(name: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('product_name_exists', {
      p_name: name.trim(),
    });

    if (error) {
      throw error;
    }

    return data === true;
  }

  /**
   * Registra un usuario con correo y contraseña.
   *
   * @param fullName Nombre completo que viaja en `options.data.full_name`.
   * @param email Correo electrónico.
   * @param password Contraseña elegida.
   * @returns Resultado con la sesión creada, si existe.
   */
  async signUp(fullName: string, email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await this.client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      throw error;
    }

    return { session: data.session };
  }

  /**
   * Inicia sesión con correo y contraseña.
   *
   * @param email Correo electrónico.
   * @param password Contraseña.
   * @returns Sesión autenticada.
   */
  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('No se pudo iniciar sesión.');
    }

    return data.session;
  }

  /** Cierra la sesión actual. */
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();

    if (error) {
      throw error;
    }
  }

  /**
   * Recupera la sesión persistida.
   *
   * @returns Sesión actual o `null`.
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await this.client.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  /**
   * Obtiene el perfil de un usuario.
   *
   * @param userId Identificador del usuario.
   * @returns Perfil normalizado o `null` si todavía no existe.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as ProfileRow;

    return {
      id: row.id,
      email: row.email ?? '',
      fullName: row.full_name,
      role: this.toRole(row.role),
    };
  }

  private toRole(value: string | null): UserRole {
    return value === 'admin' ? 'admin' : 'user';
  }
}
