import { describe, expect, it } from 'vitest';

import { contrastRatio, hexToRgb, relativeLuminance } from './contrast';

interface ContrastPair {
  readonly name: string;
  readonly foreground: string;
  readonly background: string;
  readonly minimum: number;
}

const darkPairs: readonly ContrastPair[] = [
  { name: 'texto sobre fondo', foreground: '#f5f7fb', background: '#0a0c11', minimum: 4.5 },
  { name: 'texto sobre superficie', foreground: '#f5f7fb', background: '#121620', minimum: 4.5 },
  { name: 'texto atenuado', foreground: '#a9b2c3', background: '#121620', minimum: 4.5 },
  { name: 'texto sutil sobre superficie', foreground: '#8b95a7', background: '#121620', minimum: 4.5 },
  { name: 'texto sutil sobre overlay', foreground: '#8b95a7', background: '#222938', minimum: 4.5 },
  { name: 'acento como texto', foreground: '#c6f24e', background: '#0a0c11', minimum: 4.5 },
  { name: 'texto sobre acento', foreground: '#0a0c11', background: '#c6f24e', minimum: 4.5 },
  { name: 'peligro', foreground: '#ff8080', background: '#121620', minimum: 4.5 },
  { name: 'éxito', foreground: '#6fe3af', background: '#121620', minimum: 4.5 },
  { name: 'aviso', foreground: '#ffc861', background: '#121620', minimum: 4.5 },
  { name: 'borde fuerte', foreground: '#646f83', background: '#121620', minimum: 3 },
  { name: 'anillo de foco', foreground: '#c6f24e', background: '#121620', minimum: 3 },
];

const lightPairs: readonly ContrastPair[] = [
  { name: 'texto sobre fondo', foreground: '#10141c', background: '#f5f6f8', minimum: 4.5 },
  { name: 'texto sobre superficie', foreground: '#10141c', background: '#ffffff', minimum: 4.5 },
  { name: 'texto atenuado', foreground: '#4c5566', background: '#ffffff', minimum: 4.5 },
  { name: 'texto sutil sobre superficie', foreground: '#5b6577', background: '#ffffff', minimum: 4.5 },
  { name: 'texto sutil sobre overlay', foreground: '#5b6577', background: '#e3e7ee', minimum: 4.5 },
  { name: 'acento como texto', foreground: '#3f5600', background: '#ffffff', minimum: 4.5 },
  { name: 'texto sobre acento', foreground: '#ffffff', background: '#3f5600', minimum: 4.5 },
  { name: 'peligro', foreground: '#a61b1b', background: '#ffffff', minimum: 4.5 },
  { name: 'éxito', foreground: '#0b6b45', background: '#ffffff', minimum: 4.5 },
  { name: 'aviso', foreground: '#7a4b00', background: '#ffffff', minimum: 4.5 },
  { name: 'borde fuerte', foreground: '#6b7688', background: '#ffffff', minimum: 3 },
  { name: 'anillo de foco', foreground: '#3f5600', background: '#ffffff', minimum: 3 },
];

describe('contrastRatio', () => {
  it('interpreta colores hexadecimales válidos', () => {
    expect(hexToRgb('#c6f24e')).toEqual([198, 242, 78]);
    expect(hexToRgb('c6f24e')).toEqual([198, 242, 78]);
  });

  it('rechaza colores hexadecimales no válidos', () => {
    expect(() => hexToRgb('#fff')).toThrow('Color hexadecimal no válido');
  });

  it('calcula la luminancia relativa de blanco y negro', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('devuelve 21 para blanco sobre negro', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it.each(darkPairs)('tema oscuro: $name cumple $minimum:1', ({ foreground, background, minimum }) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });

  it.each(lightPairs)('tema claro: $name cumple $minimum:1', ({ foreground, background, minimum }) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });
});
