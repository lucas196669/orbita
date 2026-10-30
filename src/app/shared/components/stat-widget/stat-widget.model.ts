/** Formatos numéricos admitidos por `app-stat-widget`. */
export type StatFormat = 'number' | 'currency' | 'percent';

/** Acento visual del widget. */
export type StatAccent = 'default' | 'success' | 'warning' | 'danger';

/** Dirección de la tendencia. */
export type TrendDirection = 'up' | 'down' | 'flat';

/** Datos calculados de la mini gráfica. */
export interface SparklineData {
  /** Puntos del trazado en el viewBox del SVG. */
  readonly points: string;
  /** Descripción accesible de la serie. */
  readonly label: string;
}
