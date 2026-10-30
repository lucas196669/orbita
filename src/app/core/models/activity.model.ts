/**
 * Registro de actividad procedente de Firestore.
 *
 * Los documentos almacenan `createdAt` como `Timestamp`, pero la interfaz
 * consume siempre un `Date` normalizado.
 */
export interface ActivityLog {
  /** Identificador del documento en Firestore. */
  readonly id: string;
  /** Acción realizada, por ejemplo `Producto creado`. */
  readonly action: string;
  /** Persona o sistema que ejecutó la acción. */
  readonly actor: string;
  /** Detalle opcional del evento. */
  readonly detail?: string;
  /** Fecha y hora del evento. */
  readonly createdAt: Date;
}

/** Acciones de demostración usadas por el generador de datos sintéticos. */
export const DEMO_ACTIVITY_ACTIONS = [
  'Producto creado',
  'Producto actualizado',
  'Pedido registrado',
  'Inicio de sesión',
  'Stock revisado',
] as const;
