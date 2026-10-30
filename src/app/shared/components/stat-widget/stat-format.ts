import type { SparklineData, StatFormat } from './stat-widget.model';

const numberFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('es-ES', {
  style: 'percent',
  maximumFractionDigits: 1,
});

/**
 * Formatea el valor principal de un widget.
 *
 * @param value Valor numérico.
 * @param format Formato solicitado.
 * @returns Texto localizado en español.
 */
export function formatStatValue(value: number, format: StatFormat): string {
  switch (format) {
    case 'currency':
      return currencyFormatter.format(value);
    case 'percent':
      return percentFormatter.format(value);
    case 'number':
    default:
      return numberFormatter.format(value);
  }
}

/**
 * Formatea una variación porcentual con signo explícito.
 *
 * @param value Variación en puntos porcentuales.
 * @returns Texto como `+4,2 %` o `-1,5 %`.
 */
export function formatTrendValue(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${numberFormatter.format(Math.abs(value))} %`;
}

/**
 * Genera los puntos y la descripción accesible de una sparkline.
 *
 * @param values Serie de valores.
 * @param format Formato usado en la descripción.
 * @param label Etiqueta del widget.
 * @returns Datos del SVG o `null` si no hay suficientes puntos.
 */
export function buildSparkline(values: readonly number[], format: StatFormat, label: string): SparklineData | null {
  const points = values.filter((value) => Number.isFinite(value));

  if (points.length < 2) {
    return null;
  }

  const width = 100;
  const height = 32;
  const padding = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (width - padding * 2) / (points.length - 1);

  const coordinates = points.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const first = points[0];
  const last = points[points.length - 1];

  return {
    points: coordinates.join(' '),
    label: `Tendencia de ${label}: de ${formatStatValue(first, format)} a ${formatStatValue(last, format)}.`,
  };
}
