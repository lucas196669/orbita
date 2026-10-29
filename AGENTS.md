# AGENTS.md · Orbita

> Lee este documento y `DESIGN.md` al empezar cualquier tarea. Si una decisión
> contradice estas reglas, pregunta antes de implementarla.

## Resumen del proyecto

**Orbita** es un panel de gestión empresarial académico para el módulo
*Desarrollo de Interfaces* (DAM). Gestiona productos, pedidos y actividad con
roles `admin` y `user`, datos asíncronos desde Supabase (SQL) y Firestore
(NoSQL), dashboard con Chart.js y exportación a PDF/CSV.

Stack: **Ionic + Angular standalone**, TypeScript estricto, SCSS, Supabase,
Firebase/Firestore, Chart.js/ng2-charts, jsPDF, Compodoc y despliegue en Vercel.

## Reglas obligatorias

1. **Standalone only**: componentes, directivas y pipes standalone. No crear
   `NgModule`.
2. **Signals**: usar `signal()`, `computed()` y `effect()` para estado local y
   derivado. Evitar `BehaviorSubject` salvo interoperabilidad justificada.
3. **OnPush**: todos los componentes usan
   `changeDetection: ChangeDetectionStrategy.OnPush`.
4. **Sin `any`**: TypeScript estricto. Usar tipos concretos, genéricos o
   `unknown` con narrowing.
5. **TSDoc**: documentar todo lo público (componentes, servicios, funciones,
   modelos, constantes exportadas, inputs/outputs).
6. **Sin secretos**: nunca versionar claves. Los entornos usan marcadores
   `PEGAR_AQUI`; las credenciales reales van en local o en el proveedor.
7. **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
   `test:`, `style:`, `perf:`, `build:`, `ci:`.
8. **Git Flow**: `main` estable, `develop` integración y una rama
   `feature/faseN-...` por fase. No trabajar directamente en `main` ni
   `develop`.
9. **Accesibilidad**: WCAG 2.1 AA. Contraste mínimo 4.5:1, foco visible,
   etiquetas ARIA, navegación por teclado, `prefers-reduced-motion`.
10. **Diseño propio**: no usar el aspecto por defecto de Ionic ni librerías de
    UI externas. Consumir tokens y utilidades del sistema de diseño.
11. **Idioma**: interfaz en español; código y commits en inglés técnico
    consistente.
12. **Datos**: Supabase para relacional, Firestore para documental. No mezclar
    responsabilidades en un mismo servicio.

## Arquitectura (MVVM)

```text
src/app/
├── core/                  # Dominio y servicios transversales (singleton)
│   ├── models/            # Interfaces, tipos y enums de dominio
│   ├── services/          # Supabase, Firestore, auth, export, etc.
│   ├── guards/            # Guards de autenticación y roles
│   └── interceptors/      # Interceptores HTTP/funcionales
├── shared/                # Reutilizable sin dependencia de features
│   ├── components/        # Componentes con @Input/@Output
│   ├── pipes/             # Pipes puros
│   └── utils/             # Funciones puras y helpers
├── features/              # Páginas y viewmodels por dominio
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   └── help/
├── layout/                # Shell, navegación y estructura visual
│   └── shell/
├── app.component.ts
└── app.routes.ts
```

- Cada feature expone sus rutas con **lazy loading** (`loadChildren` o
  `loadComponent`).
- La vista no contiene lógica de negocio: delega en un viewmodel/servicio.
- Los componentes compartidos deben ser presentacionales, con `@Input` y
  `@Output` explícitos y sin dependencias de una feature concreta.
- `core/services` se provee en raíz; los datos de Supabase y Firestore se
  encapsulan en servicios separados.

## Rutas y control de acceso (Fase 1)

Todas las páginas se cargan con `loadComponent` (lazy loading) y
`withComponentInputBinding()` / `withPreloading(PreloadAllModules)`.

| Ruta | Página | Acceso |
| --- | --- | --- |
| `/login` | `features/auth/login` | Solo invitados (`guestGuard`) |
| `/app` | `layout/shell` | Autenticado (`authGuard`) |
| `/app/inicio` | `features/home` | Autenticado |
| `/app/dashboard` | `features/dashboard` | Solo `admin` (`roleGuard`) |
| `/app/productos` | `features/products` | Autenticado |
| `/app/pedidos` | `features/orders` | Autenticado |
| `/app/ayuda` | `features/help` | Autenticado |
| `/acceso-denegado` | `features/errors` (403) | Pública |
| `''` | Redirección a `/app/inicio` | — |
| `**` | `features/errors` (404) | Pública |

- `authGuard`: sin sesión redirige a `/login` con `returnUrl`.
- `roleGuard`: lee `route.data['roles']` y redirige a `/acceso-denegado` si el
  rol no está permitido.
- `guestGuard`: con sesión activa redirige a `/app/inicio`.
- `AuthService` se inicializa con `provideAppInitializer` y lee el rol siempre
  de la tabla `profiles`; nunca de `localStorage` ni del cliente.
- `authInterceptor` añade `Authorization: Bearer <access_token>` a las
  peticiones de Supabase y, ante un `401`, cierra sesión y vuelve a `/login`.

## Sistema de diseño

Fuente de verdad: `src/theme/tokens.scss`. Documentación y ratios de contraste:
`DESIGN.md`.

- **Tema oscuro por defecto** (`<html data-theme="dark">`), claro con
  `[data-theme="light"]` y automático con `[data-theme="auto"]`.
- **Tipografía**: Space Grotesk para títulos, Inter para texto. Siempre `rem`.
- **Acento único**: lima (`#c6f24e` en oscuro, `#3f5600` en claro para texto).
- **Utilidades obligatorias**: `.bento`, `.card`, `.stack`, `.cluster`,
  `.sr-only`, `.skip-link`.
- **No hardcodear colores, espacios, radios ni sombras**: usar variables CSS.
- **Foco**: 3 px de outline con 3 px de offset; no eliminarlo nunca.
- **Movimiento**: respetar `prefers-reduced-motion`.
- **Formularios**: controles con borde `--color-border-strong`, etiquetas
  visibles y mensajes de error asociados con `aria-describedby`.

## Comandos

```bash
npm install          # instalar dependencias
npm start            # servidor de desarrollo (ng serve)
ionic serve          # alternativa Ionic
npm run build        # build de producción
npm run lint         # ESLint + typecheck e2e + Prettier
npm run test:unit    # tests unitarios (Vitest)
npm run test:e2e     # tests e2e (Playwright)
npm run docs         # generar documentación Compodoc en documentation/
```

Antes de cerrar una tarea: `npm run build` y `npm run lint` deben pasar.
