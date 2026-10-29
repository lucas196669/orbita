# Orbita · Sistema de diseño

Sistema de diseño editorial oscuro, con un único acento lima y un tema claro
alternativo. Todos los tokens viven en `src/theme/tokens.scss` y sobrescriben
las variables públicas de Ionic. La tipografía se define en `rem` para que la
interfaz escale con el tamaño de texto del navegador.

## Principios

- **Oscuro por defecto**: fondo casi negro azulado y superficies elevadas sutiles.
- **Un solo acento**: lima vivo para acciones, enlaces, foco y datos destacados.
- **Contraste primero**: ningún par texto/fondo baja de WCAG AA (4.5:1).
- **Movimiento opcional**: se respeta `prefers-reduced-motion`.
- **Foco inequívoco**: contorno de 3 px con separación de 3 px.
- **Escalable**: espaciado y tipografía en `rem`, sin tamaños fijos en píxeles.

## Paleta

### Tema oscuro (por defecto)

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-bg` | `#0a0c11` | Fondo del documento |
| `--color-surface` | `#121620` | Tarjetas y superficies base |
| `--color-surface-raised` | `#1a1f2b` | Superficies elevadas |
| `--color-surface-overlay` | `#222938` | Menús, modales y overlays |
| `--color-text` | `#f5f7fb` | Texto principal |
| `--color-text-muted` | `#a9b2c3` | Texto secundario |
| `--color-text-subtle` | `#8b95a7` | Metadatos y ayudas |
| `--color-accent` | `#c6f24e` | Acento lima (texto, iconos, foco) |
| `--color-accent-strong` | `#d4ff66` | Acento en hover |
| `--color-accent-contrast` | `#0a0c11` | Texto sobre relleno de acento |
| `--color-border` | `#2a3140` | Bordes decorativos |
| `--color-border-strong` | `#646f83` | Bordes de controles (≥ 3:1) |
| `--color-danger` | `#ff8080` | Error |
| `--color-success` | `#6fe3af` | Éxito |
| `--color-warning` | `#ffc861` | Aviso |

### Tema claro (`[data-theme="light"]`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-bg` | `#f5f6f8` | Fondo del documento |
| `--color-surface` | `#ffffff` | Tarjetas y superficies base |
| `--color-surface-raised` | `#eceff4` | Superficies elevadas |
| `--color-surface-overlay` | `#e3e7ee` | Menús, modales y overlays |
| `--color-text` | `#10141c` | Texto principal |
| `--color-text-muted` | `#4c5566` | Texto secundario |
| `--color-text-subtle` | `#5b6577` | Metadatos y ayudas |
| `--color-accent` | `#3f5600` | Acento lima oscurecido para texto |
| `--color-accent-strong` | `#2f4100` | Acento en hover |
| `--color-accent-fill` | `#b6e62e` | Relleno decorativo vivo |
| `--color-accent-contrast` | `#10141c` | Texto sobre `--color-accent-fill` |
| `--color-border` | `#d3d9e3` | Bordes decorativos |
| `--color-border-strong` | `#6b7688` | Bordes de controles (≥ 3:1) |
| `--color-danger` | `#a61b1b` | Error |
| `--color-success` | `#0b6b45` | Éxito |
| `--color-warning` | `#7a4b00` | Aviso |

### Cambio de tema

```html
<html data-theme="dark">   <!-- oscuro explícito (por defecto) -->
<html data-theme="light">  <!-- claro explícito -->
<html data-theme="auto">   <!-- sigue prefers-color-scheme -->
```

El tema oscuro es el valor por defecto de `:root`. `[data-theme="auto"]` respeta
`prefers-color-scheme: light` para quien prefiera el tema claro a nivel de
sistema operativo.

## Tipografía

| Token | Valor |
| --- | --- |
| `--font-display` | `Space Grotesk Variable`, sistema |
| `--font-body` | `Inter Variable`, sistema |
| `--font-mono` | Monoespaciada del sistema |
| `--text-xs` → `--text-5xl` | `0.75rem` → `3.75rem` |
| `--leading-tight` / `--leading-normal` | `1.1` / `1.6` |
| `--tracking-tight` | `-0.02em` |

Los títulos (`h1`–`h6`) usan Space Grotesk; el texto corrido y los controles usan
Inter. Los tamaños grandes emplean `clamp()` con unidades `rem` para mantener la
escala accesible.

## Espaciado, radios y sombras

- Espaciado: escala de 4 px en `rem`, de `--space-1` (`0.25rem`) a `--space-24`
  (`6rem`).
- Radios: `--radius-xs` (`0.25rem`) a `--radius-xl` (`2rem`) y `--radius-full`.
- Sombras: `--shadow-sm`, `--shadow-md` y `--shadow-lg`, adaptadas por tema.
- Transiciones: `--transition-fast` (120 ms), `--transition-base` (200 ms) y
  `--transition-slow` (320 ms).

## Foco y movimiento

- `:focus-visible` aplica `outline: 3px solid var(--color-focus)` con
  `outline-offset: 3px` en enlaces, botones, campos, `summary` y elementos con
  `tabindex`.
- Los componentes Ionic reciben el mismo anillo mediante `::part(native)`.
- Con `prefers-reduced-motion: reduce` se anulan animaciones, transiciones y
  desplazamiento suave.

## Utilidades

| Clase | Función |
| --- | --- |
| `.bento` | Cuadrícula responsive de tarjetas con `auto-fit` |
| `.card` | Superficie elevada con borde, radio, sombra y padding fluido |
| `.stack` | Columna flexible con separación uniforme |
| `.cluster` | Fila flexible que envuelve elementos |
| `.sr-only` | Contenido solo para lectores de pantalla |
| `.skip-link` | Enlace de salto visible al recibir foco |

## Ratios de contraste (WCAG AA)

Calculados con la fórmula de luminancia relativa de WCAG 2.x:
`(L1 + 0.05) / (L2 + 0.05)`. Texto normal exige 4.5:1; texto grande, 3:1;
componentes no textuales, 3:1.

### Tema oscuro

| Combinación | Ratio | Cumple |
| --- | --- | --- |
| Texto `#f5f7fb` / fondo `#0a0c11` | 18.24:1 | AA / AAA |
| Texto `#f5f7fb` / superficie `#121620` | 16.86:1 | AA / AAA |
| Texto `#f5f7fb` / elevada `#1a1f2b` | 15.36:1 | AA / AAA |
| Secundario `#a9b2c3` / fondo `#0a0c11` | 9.17:1 | AA / AAA |
| Secundario `#a9b2c3` / superficie `#121620` | 8.48:1 | AA / AAA |
| Secundario `#a9b2c3` / elevada `#1a1f2b` | 7.72:1 | AA / AAA |
| Sutil `#8b95a7` / fondo `#0a0c11` | 6.48:1 | AA |
| Sutil `#8b95a7` / superficie `#121620` | 5.99:1 | AA |
| Sutil `#8b95a7` / elevada `#1a1f2b` | 5.46:1 | AA |
| Acento `#c6f24e` / fondo `#0a0c11` | 15.10:1 | AA / AAA |
| Acento `#c6f24e` / superficie `#121620` | 13.96:1 | AA / AAA |
| Acento `#c6f24e` / elevada `#1a1f2b` | 12.72:1 | AA / AAA |
| Acento `#c6f24e` / overlay `#222938` | 11.24:1 | AA / AAA |
| Texto `#0a0c11` / acento `#c6f24e` | 15.10:1 | AA / AAA |
| Error `#ff8080` / fondo `#0a0c11` | 8.06:1 | AA / AAA |
| Éxito `#6fe3af` / fondo `#0a0c11` | 12.37:1 | AA / AAA |
| Aviso `#ffc861` / fondo `#0a0c11` | 12.75:1 | AA / AAA |
| Borde fuerte `#646f83` / superficie `#121620` | 3.57:1 | No textual |
| Borde fuerte `#646f83` / elevada `#1a1f2b` | 3.25:1 | No textual |

### Tema claro

| Combinación | Ratio | Cumple |
| --- | --- | --- |
| Texto `#10141c` / fondo `#f5f6f8` | 17.05:1 | AA / AAA |
| Texto `#10141c` / superficie `#ffffff` | 18.44:1 | AA / AAA |
| Texto `#10141c` / elevada `#eceff4` | 16.00:1 | AA / AAA |
| Secundario `#4c5566` / fondo `#f5f6f8` | 6.94:1 | AA |
| Secundario `#4c5566` / superficie `#ffffff` | 7.50:1 | AA |
| Secundario `#4c5566` / elevada `#eceff4` | 6.51:1 | AA |
| Sutil `#5b6577` / fondo `#f5f6f8` | 5.44:1 | AA |
| Sutil `#5b6577` / superficie `#ffffff` | 5.88:1 | AA |
| Sutil `#5b6577` / elevada `#eceff4` | 5.10:1 | AA |
| Acento `#3f5600` / fondo `#f5f6f8` | 7.64:1 | AA / AAA |
| Acento `#3f5600` / superficie `#ffffff` | 8.26:1 | AA / AAA |
| Acento `#3f5600` / elevada `#eceff4` | 7.17:1 | AA |
| Acento `#3f5600` / overlay `#e3e7ee` | 6.66:1 | AA |
| Texto `#10141c` / relleno `#b6e62e` | 12.60:1 | AA / AAA |
| Error `#a61b1b` / superficie `#ffffff` | 7.52:1 | AA / AAA |
| Éxito `#0b6b45` / superficie `#ffffff` | 6.56:1 | AA |
| Aviso `#7a4b00` / superficie `#ffffff` | 7.41:1 | AA / AAA |
| Borde fuerte `#6b7688` / superficie `#ffffff` | 4.59:1 | No textual |
| Borde fuerte `#6b7688` / elevada `#eceff4` | 3.98:1 | No textual |

## Variables de Ionic sobrescritas

`--ion-color-primary` y sus variantes (`rgb`, `contrast`, `shade`, `tint`),
`--ion-background-color`, `--ion-background-color-rgb`, `--ion-text-color`,
`--ion-text-color-rgb`, `--ion-font-family`, `--ion-default-font`,
`--ion-card-background`, `--ion-item-background`, `--ion-toolbar-background`,
`--ion-tab-bar-background`, `--ion-border-color`, `--ion-color-light`,
`--ion-color-medium` y `--ion-color-dark`.
