/** Roles disponibles en Orbita. El cliente nunca asigna roles manualmente. */
export type UserRole = 'admin' | 'user';

/** Perfil público de un usuario autenticado. */
export interface UserProfile {
  /** Identificador del usuario en Supabase Auth. */
  readonly id: string;
  /** Correo electrónico principal. */
  readonly email: string;
  /** Nombre completo mostrado en la interfaz. */
  readonly fullName: string;
  /** Rol efectivo calculado en el servidor. */
  readonly role: UserRole;
}
