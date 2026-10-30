import type { TableColumnFormat } from './data-table.model';

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

const numberFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
});

/**
 * Convierte el valor de una celda en texto legible.
 *
 * @param value Valor crudo de la fila.
 * @param format Formato solicitado por la columna.
 * @returns Texto formateado; `—` para valores vacíos.
 */
export function formatCellValue(value: unknown, format: TableColumnFormat | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (format) {
    case 'currency': {
      const amount = Number(value);
      return Number.isFinite(amount) ? currencyFormatter.format(amount) : String(value);
    }
    case 'number': {
      const amount = Number(value);
      return Number.isFinite(amount) ? numberFormatter.format(amount) : String(value);
    }
    case 'date': {
      const date = value instanceof Date ? value : new Date(String(value));

      return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date);
    }
    case 'badge':
    case 'text':
    default:
      return String(value);
  }
}
