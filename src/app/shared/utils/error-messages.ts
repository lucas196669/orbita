/** Forma mínima y segura de un error devuelto por Supabase. */
interface ErrorLike {
  readonly message?: unknown;
  readonly code?: unknown;
}

/**
 * Extrae un mensaje legible de un error de autenticación.
 *
 * @param error Error desconocido capturado en el formulario.
 * @returns Mensaje en español listo para mostrar.
 */
export function describeAuthError(error: unknown): string {
  const info = toErrorLike(error);
  const message = readString(info?.message).toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'El correo o la contraseña no son correctos.';
  }

  if (message.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.';
  }

  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'Ya existe una cuenta con este correo electrónico.';
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }

  if (message.includes('password')) {
    return 'La contraseña no cumple los requisitos mínimos.';
  }

  return 'No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.';
}

/**
 * Extrae un mensaje legible de un error de datos o de RLS.
 *
 * @param error Error desconocido capturado al guardar.
 * @returns Mensaje en español listo para mostrar.
 */
export function describeDataError(error: unknown): string {
  const info = toErrorLike(error);
  const code = readString(info?.code);
  const message = readString(info?.message).toLowerCase();

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (code === '23505' || message.includes('duplicate key')) {
    return 'Ya existe un registro con esos datos.';
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch')) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }

  if (code === 'PGRST116') {
    return 'No se encontró el registro solicitado.';
  }

  return 'No se pudo guardar la información. Inténtalo de nuevo.';
}

function toErrorLike(error: unknown): ErrorLike | null {
  return typeof error === 'object' && error !== null ? (error as ErrorLike) : null;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
