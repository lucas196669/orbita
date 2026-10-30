/** Roles disponibles en Orbita. El cliente nunca asigna roles manualmente. */
export type Role = 'admin' | 'user';

/** Alias de rol usado por los servicios de datos de la fase 2. */
export type UserRole = Role;

/** Usuario autenticado con el rol leído siempre desde la tabla `profiles`. */
export interface AppUser {
  /** Identificador del usuario en Supabase Auth. */
  readonly id: string;
  /** Correo electrónico principal. */
  readonly email: string;
  /** Nombre completo mostrado en la interfaz. */
  readonly fullName: string | null;
  /** Rol efectivo calculado en el servidor. */
  readonly role: Role;
}

/** Alias de perfil público usado por los servicios de datos de la fase 2. */
export type UserProfile = AppUser;
