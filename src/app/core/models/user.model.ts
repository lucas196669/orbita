/** Rol de acceso disponible en Orbita. */
export type Role = 'admin' | 'user';

/** Usuario autenticado con el rol leído desde Supabase. */
export interface AppUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string | null;
  readonly role: Role;
}
