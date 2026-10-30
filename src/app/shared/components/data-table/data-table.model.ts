/** Formatos de celda admitidos por `app-data-table`. */
export type TableColumnFormat = 'text' | 'currency' | 'number' | 'date' | 'badge';

/** Alineación horizontal de una columna. */
export type TableColumnAlign = 'start' | 'center' | 'end';

/** Dirección de ordenación. */
export type SortDirection = 'asc' | 'desc';

/** Definición de una columna de la tabla. */
export interface TableColumn<T> {
  /** Clave de la propiedad de la fila que se muestra. */
  readonly key: keyof T & string;
  /** Texto visible de la cabecera. */
  readonly header: string;
  /** Permite ordenar por esta columna. */
  readonly sortable?: boolean;
  /** Alineación del contenido. */
  readonly align?: TableColumnAlign;
  /** Formato de presentación del valor. */
  readonly format?: TableColumnFormat;
}

/** Estado de ordenación activo. */
export interface SortState {
  /** Clave de la columna ordenada. */
  readonly key: string;
  /** Dirección de la ordenación. */
  readonly direction: SortDirection;
}

/**
 * Acción de fila.
 *
 * El componente no conoce roles ni permisos: el padre decide qué acciones
 * entrega en cada momento.
 */
export interface RowAction {
  /** Identificador estable de la acción. */
  readonly id: string;
  /** Texto visible del botón. */
  readonly label: string;
  /** Trazado SVG opcional del icono. */
  readonly icon?: string;
  /** Roles informativos que pueden ver la acción. */
  readonly roles?: readonly string[];
}

/** Evento emitido al activar una acción de fila. */
export interface TableActionEvent<T> {
  /** Identificador de la acción activada. */
  readonly actionId: string;
  /** Fila sobre la que se ha actuado. */
  readonly row: T;
}

/** Contexto disponible en las plantillas de celda personalizadas. */
export interface TableCellContext<T> {
  /** Fila completa. */
  readonly $implicit: T;
  /** Valor crudo de la celda. */
  readonly value: unknown;
  /** Columna que se está pintando. */
  readonly column: TableColumn<T>;
}
