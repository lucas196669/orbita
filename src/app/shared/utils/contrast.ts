/**
 * Utilidades de contraste basadas en WCAG 2.1.
 *
 * Se usan en pruebas para verificar que los pares de tokens del sistema de
 * diseño cumplen los mínimos de texto y componentes.
 */

/**
 * Convierte un color hexadecimal de 6 dígitos en sus canales RGB.
 *
 * @param hex Color con formato `#rrggbb`.
 * @returns Canales rojo, verde y azul entre 0 y 255.
 */
export function hexToRgb(hex: string): readonly [number, number, number] {
  const normalized = hex.trim().replace(/^#/, '');

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    throw new Error(`Color hexadecimal no válido: ${hex}`);
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

/**
 * Calcula la luminancia relativa de un color.
 *
 * @param hex Color con formato `#rrggbb`.
 * @returns Luminancia relativa según WCAG.
 */
export function relativeLuminance(hex: string): number {
  const channels = hexToRgb(hex).map((channel) => {
    const value = channel / 255;

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

/**
 * Calcula el ratio de contraste entre dos colores.
 *
 * @param foreground Color de primer plano.
 * @param background Color de fondo.
 * @returns Ratio entre 1 y 21.
 */
export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}
