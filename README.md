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

## Datos y dashboard

- **Supabase** guarda productos, pedidos y perfiles. `ProductsService` y
  `OrdersService` aíslan las consultas y mutaciones del cliente.
- **Firestore** almacena la colección documental `activity`. El dashboard la
  escucha en tiempo real y permite generar 30 registros de demostración desde la
  propia interfaz. Si Firebase no está configurado, la aplicación sigue
  funcionando sin actividad.
- El dashboard (`/app/dashboard`, solo `admin`) permite filtrar por rango de
  fechas y categoría, muestra métricas, cuatro gráficos Chart.js y un feed de
  actividad. Los datos se cargan en paralelo con estados de carga y error
  independientes.
- La actividad registra inicios de sesión y altas, actualizaciones y bajas de
  producto. Las altas de pedidos aún no tienen flujo propio.

## Exportación

`shared/services/export.service.ts` genera CSV y PDF reutilizables:

- **CSV**: BOM UTF-8, separador `;`, coma decimal y neutralización de fórmulas.
- **PDF**: `jsPDF` + `jspdf-autotable` con carga dinámica, cabecera con filtros,
  tabla paginada y pie con usuario y número de página.

Está disponible en el dashboard, el catálogo de productos y el listado de
pedidos.

## Credenciales de prueba

<!-- Rellenar cuando existan usuarios y datos de demostración. -->

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| `admin` | Pendiente | Pendiente |
| `user` | Pendiente | Pendiente |

## Manual de usuario

<!-- Rellenar con capturas y credenciales cuando existan usuarios de demostración. -->

1. Inicia sesión en `/login` o crea una cuenta en `/registro`.
2. Consulta el catálogo en `/app/productos`. Los usuarios `admin` pueden crear,
   editar, eliminar y exportar productos.
3. Revisa los pedidos en `/app/pedidos` y expórtalos a CSV o PDF.
4. Si eres `admin`, abre `/app/dashboard` para consultar métricas, filtrar por
   rango o categoría, generar actividad de demostración y exportar los pedidos
   filtrados.
5. Cambia entre tema claro y oscuro desde el shell.

## Despliegue

El proyecto se despliega en Vercel. `vercel.json` configura la reescritura SPA
hacia `index.html` y el directorio de salida `www`.
