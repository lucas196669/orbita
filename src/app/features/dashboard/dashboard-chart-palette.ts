/** Colores concretos usados por Chart.js, leídos de los tokens CSS. */
export interface ChartPalette {
  /** Acento principal de la interfaz. */
  readonly accent: string;
  /** Superficie base de las tarjetas. */
  readonly surface: string;
  /** Superficie elevada. */
  readonly surfaceRaised: string;
  /** Texto principal. */
  readonly text: string;
  /** Texto secundario. */
  readonly textMuted: string;
  /** Bordes decorativos. */
  readonly border: string;
  /** Color de éxito. */
  readonly success: string;
  /** Color de aviso. */
  readonly warning: string;
  /** Color de error. */
  readonly danger: string;
  /** Texto legible sobre el acento. */
  readonly accentContrast: string;
}

const FALLBACK_PALETTE: ChartPalette = {
  accent: '#c6f24e',
  surface: '#121620',
  surfaceRaised: '#1a1f2b',
  text: '#f5f7fb',
  textMuted: '#a9b2c3',
  border: '#2a3140',
  success: '#6fe3af',
  warning: '#ffc861',
  danger: '#ff8080',
  accentContrast: '#0a0c11',
};

/**
 * Lee los tokens CSS del documento para pintar los gráficos.
 *
 * @param document Documento del navegador.
 * @returns Paleta resuelta con respaldo seguro para entornos sin estilos.
 */
export function readChartPalette(document: Document): ChartPalette {
  const styles = document.defaultView?.getComputedStyle(document.documentElement);
  const read = (token: string, fallback: string): string => styles?.getPropertyValue(token).trim() || fallback;

  return {
    accent: read('--color-accent', FALLBACK_PALETTE.accent),
    surface: read('--color-surface', FALLBACK_PALETTE.surface),
    surfaceRaised: read('--color-surface-raised', FALLBACK_PALETTE.surfaceRaised),
    text: read('--color-text', FALLBACK_PALETTE.text),
    textMuted: read('--color-text-muted', FALLBACK_PALETTE.textMuted),
    border: read('--color-border', FALLBACK_PALETTE.border),
    success: read('--color-success', FALLBACK_PALETTE.success),
    warning: read('--color-warning', FALLBACK_PALETTE.warning),
    danger: read('--color-danger', FALLBACK_PALETTE.danger),
    accentContrast: read('--color-accent-contrast', FALLBACK_PALETTE.accentContrast),
  };
}

/**
 * Convierte un color hexadecimal en `rgba` para rellenos translúcidos.
 *
 * @param hex Color en formato `#rrggbb` o `#rgb`.
 * @param alpha Opacidad entre 0 y 1.
 * @returns Color CSS `rgba`.
 */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((part) => part + part)
          .join('')
      : normalized;

  if (full.length !== 6) {
    return hex;
  }

  const red = Number.parseInt(full.slice(0, 2), 16);
  const green = Number.parseInt(full.slice(2, 4), 16);
  const blue = Number.parseInt(full.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
