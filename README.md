# Orbita

Panel de gestión empresarial académico para el módulo **Desarrollo de
Interfaces** (DAM). Permite administrar productos, pedidos y actividad con roles
`admin` y `user`, con datos asíncronos en Supabase (SQL) y Firestore (NoSQL),
dashboard con Chart.js y exportación a PDF/CSV.

## Stack

- **Ionic + Angular standalone** con TypeScript estricto y SCSS.
- **Supabase** para datos relacionales.
- **Firebase / Firestore** para datos documentales.
- **Chart.js + ng2-charts** para visualizaciones.
- **jsPDF + jspdf-autotable** para exportación a PDF y CSV.
- **Compodoc** para documentación técnica.
- **Vercel** para despliegue.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Ionic CLI (opcional, para `ionic serve`).

## Instalación

```bash
npm install
```

Copia los marcadores `PEGAR_AQUI` de `src/environments/environment.ts` por las
credenciales locales de Supabase y Firebase. **No versiones claves reales.**

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `ionic serve` | Alternativa con Ionic CLI |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint + typecheck e2e + Prettier |
| `npm run lint:fix` | Corrección automática de lint y formato |
| `npm run test:unit` | Tests unitarios con Vitest |
| `npm run test:e2e` | Tests end-to-end con Playwright |
| `npm run docs` | Genera Compodoc en `documentation/` |

## Estructura

```text
src/
├── app/
│   ├── core/              # Modelos, servicios, guards e interceptores
│   ├── shared/            # Componentes, pipes y utilidades reutilizables
│   ├── features/          # auth, dashboard, products, orders, help
│   └── layout/            # Shell y estructura visual
├── environments/          # Configuración sin secretos
├── theme/
│   └── tokens.scss        # Sistema de diseño
├── global.scss
└── index.html
```

El sistema de diseño y los ratios de contraste se documentan en
[`DESIGN.md`](DESIGN.md). Las convenciones de trabajo están en
[`AGENTS.md`](AGENTS.md).

## Credenciales de prueba

<!-- Rellenar cuando existan usuarios y datos de demostración. -->

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| `admin` | Pendiente | Pendiente |
| `user` | Pendiente | Pendiente |

## Manual de usuario

<!-- Rellenar con el flujo de acceso, gestión de productos, pedidos y actividad. -->

Pendiente de redacción.

## Despliegue

El proyecto se despliega en Vercel. `vercel.json` configura la reescritura SPA
hacia `index.html` y el directorio de salida `www`.
