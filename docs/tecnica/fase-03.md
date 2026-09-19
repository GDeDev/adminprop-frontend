# Fase 3 — Setup (frontend)

> Spec: `../adminprop-repo-files/specs/fase-03-setup.md`. Rama `feature/fase-03-setup`.
> Resumen para no técnicos: [`../funcional/fase-03.md`](../funcional/fase-03.md).

## Qué parte de la spec se hizo acá

La Fase 3 describe un monorepo único. Con dos repos, el reparto quedó así:

| Sección de la spec                                                | Dónde / cómo                                                                                                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.2 API, 2.3 base de datos, 2.9 Doppler y Flagsmith, 2.10 pg-boss | Backend, **ya hecho en la Fase 1** (`adminprop-backend/docs/tecnica/fase-01.md`). El flag de prueba es `example-bulk-recalculate` y el job con reintento es el de `_example` |
| 2.4 Sistema de diseño                                             | Esta fase, `packages/ui`                                                                                                                                                     |
| 2.5 Backoffice, 2.6 Portal                                        | Esta fase: el scaffold ya existía, se le aplicó el sistema de diseño                                                                                                         |
| 2.7 `shared-utils/money.ts`                                       | **No se hace**: la plata se calcula solo en la API (DT-11)                                                                                                                   |
| 2.7 `shared-types`                                                | Existe como puente; `ApiError` se alineó con la API. Los tipos del contrato HTTP se van a generar desde el OpenAPI (DT-12) al conectar el primer módulo real (Fase 4)        |
| 2.8 Tooling, 2.11 CI                                              | Esta fase, para el frontend (el backend ya los tenía)                                                                                                                        |

## Qué quedó construido

### Tokens y fuentes

- `packages/ui/src/styles/adminprop.css` es **copia textual** de `packages-ui-source/globals.css`. No se edita: si el sistema de diseño cambia, se vuelve a copiar entero. Prettier lo ignora para que no se reformatee.
- `packages/ui/src/styles/globals.css` es el punto de entrada de las apps: importa lo anterior más `tw-animate-css`, declara los `@source` del monorepo y pone Outfit en `h1`-`h3`.
- Fuentes con `next/font/google` en cada app (`src/lib/fonts.ts`): Outfit → `--font-outfit` (`font-display`) y Figtree → `--font-figtree` (`font-sans`).
- Se borró el tema del scaffold (Fraunces/Inter, verde, tokens `nav-*`).

### Componentes (`packages/ui/src/components`)

- Set completo de shadcn que pide `ADMINPROP-UI.md`, estilo **new-york**, más `field` (formularios con React Hook Form, DT-03).
- Ajustes obligatorios después de instalar:
  - `accent` no es hover: todo `hover:`/`focus:`/`data-[…]:bg-accent` pasó a `bg-muted`, y `text-accent-foreground` a `text-foreground`.
  - `destructive` usa `text-destructive-foreground` en vez de `text-white`, y se sacó el `dark:bg-destructive/60` (el token ya cambia en modo oscuro).
  - Área táctil de 44px en mobile: `Button` (default, lg, icon), `Input` y `SelectTrigger` miden `h-11` y vuelven al tamaño de shadcn desde `md:`.
  - `Calendar` en español por defecto.
  - `test/design-rules.test.ts` revisa estas reglas en cada componente (sin hover con accent, sin hex, sin `text-white`). Si un `shadcn add` futuro trae algo prohibido, el test falla.
- `Badge` con las variantes de estado del dominio: `disponible`, `alquilada`, `mantenimiento`, `mora` y `borrador` (tabla estado → token).
- Componentes propios:
  - `AppSidebar`: 248px, chrome `sidebar*`, visible desde `md:`, con slots `header` y `footer`.
  - `BottomNav`: hasta 5 destinos, fondo `sidebar`, oculta desde `md:`. Con `more` agrega "Más", que abre un Drawer con el resto.
  - `EmptyState`: título (qué falta), descripción (por qué) y acción.
  - `ThemeToggle`: claro/oscuro con `next-themes`.
  - `ResponsiveDialog`: la API de `Dialog`, pero en mobile se muestra como `Drawer`. Usa el hook `useIsDesktop()` (`hooks/use-media-query.ts`).
  - `ComingSoon` ahora está hecho sobre `EmptyState`. `BottomSheet` se borró: en mobile se usa `Drawer`.
- Los dos navs reciben `pathname` y `linkComponent` (las apps pasan `next/link`), así `packages/ui` no depende del router de Next.

### Tema por inmobiliaria

- `packages/ui/src/lib/tenant-theme.ts`: `tenantThemeStyle(primaryColor)` devuelve el `style` del `<html>` con `--primary` y `--primary-foreground`.
  - Solo acepta `#rgb` o `#rrggbb`. Cualquier otro valor deja el tema default, así un dato raro de la base no inyecta CSS.
  - El foreground se elige por contraste WCAG (texto claro u oscuro) y sale de tokens (`--sidebar-foreground` / `--sidebar`), no de un hex.
- Cada app tiene `src/lib/tenant-branding.ts` con `getTenantBranding()`. Hoy devuelve `null` (tema default):
  - Backoffice: en la Fase 4 va a leer el tenant de la sesión.
  - Portal: en la Fase 22 lo va a resolver por dominio.

### Apps

- Root layout de las dos apps: fuentes, `suppressHydrationWarning` (lo necesita next-themes), el style del tenant y `Providers`, que incluye ThemeProvider (claro/oscuro/sistema), TanStack Query, TooltipProvider y el Toaster de Sonner.
- Backoffice:
  - `AppShell`: barra superior + `BottomNav` en mobile (Inicio, Propiedades, Contratos, Cobros + "Más" con Propietarios, Inquilinos y Configuración); `AppSidebar` desde `md:`.
  - `/design-system`: vitrina **solo de desarrollo** (404 en producción) con tokens, tipografía, botones, estados, formularios, tabla con montos, ResponsiveDialog, toast, estado vacío, skeleton y un **simulador de tema por inmobiliaria**.
- Portal: el área de propietarios (5 secciones) y la de inquilinos (4) usan el mismo patrón `AppSidebar` + `BottomNav`. El header público y los logins usan el chrome `sidebar`.
- `api-client.ts` (las dos apps) ya tenía el Bearer y el manejo del 401. Ahora tiene tests.
- `@adminprop/shared-types`:
  - `ApiError` copia el cuerpo de error real de la API (`success`, `statusCode`, `error`, `code`, `message`, `errors[]`, `correlationId`, `timestamp`, `path`).
  - `ApiSuccess<T>` copia el sobre OK (`success`, `message`, `data`).
- `.env.example` apunta a `http://localhost:3000/api/v1` y aclara que los valores salen de Doppler.

### Tooling

- **Vitest 5** + Testing Library + jsdom en `packages/ui`, `apps/backoffice` y `apps/portal` (`vitest.config.ts` y `test/setup.ts` en cada uno). Tarea `test` en turbo.
- **Husky + lint-staged** en la raíz. El pre-commit corre, sobre los archivos staged:
  - `prettier --write`;
  - `eslint --fix --max-warnings=0`, con `--flag v10_config_lookup_from_file` para que cada archivo use el `eslint.config.js` de su workspace;
  - `vitest related --run` en el workspace tocado. Si el cambio está en `packages/`, también en las apps.
- `lint` falla con cualquier warning (`--max-warnings=0`): `eslint-plugin-only-warn` convierte todo en warning y, sin esto, el lint nunca fallaba.
- `eslint.config.mjs` en la raíz, solo para los archivos de configuración (Node).
- `npm run format:check` / `format:write`; todo el repo quedó formateado.
- turbo: `NODE_ENV` como `globalEnv` y `NEXT_PUBLIC_*` como env del build.
- **CI** (`.github/workflows/ci.yml`), en push/PR a `main` y `dev`:
  - formato, lint, tipos y tests;
  - `next build` de las dos apps, sin Doppler y con una URL de API descartable;
  - `npm audit --audit-level=high`.

## Tests

| Workspace             | Qué cubre                                                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui` (38)    | `cn`, reglas del sistema de diseño, variantes de `Badge`, `AppSidebar`/`BottomNav` (activo, link inyectado, Drawer de "Más"), `EmptyState`, `ThemeToggle`, `ResponsiveDialog` mobile/desktop, `tenantThemeStyle` (validación y contraste), `isActivePath` |
| `apps/backoffice` (7) | Config de navegación (máx. 5 en mobile, sin repetir), `apiClient` (Bearer, 401 → login, sin redirect en `/login` ni en otros errores)                                                                                                                     |
| `apps/portal` (9)     | Navegación por rol, `apiClient` (401 → login del área correcta, sin redirect en páginas públicas)                                                                                                                                                         |

## Criterios de aceptación de la spec (parte frontend)

- [x] El pre-commit rechaza un commit con un test roto (probado).
- [x] Código mal formateado no entra: el pre-commit lo formatea con Prettier (mismo criterio que el backend) y el CI corre `format:check`.
- [x] El backoffice muestra `BottomNav` en mobile y `AppSidebar` desde `md:`, con el chrome oscuro y los tokens en los dos modos (revisado con capturas a 375px, 600px y 1280px, en claro y oscuro).
- [x] `Button` de `packages/ui` se renderiza en backoffice y portal.
- [x] Las variantes de `Badge` usan los colores de la tabla estado → token (test + vitrina).
- [x] Pisar `--primary` en el `<html>` cambia el color de marca sin tocar componentes (simulador en `/design-system`).
- [ ] `turbo dev` levanta "las 3 apps": no aplica, la API es otro repo. `npm run dev` levanta backoffice (:3001) y portal (:3002).
- Los criterios de backend (Postgres, `/health`, migraciones, Doppler, Flagsmith, pg-boss) se cumplieron en la Fase 1.

## Pendientes que heredan otras fases

- **Fase 4**:
  - `getTenantBranding()` del backoffice tiene que leer el tenant de la sesión (hace falta que la API exponga `name`, `logoUrl` y `primaryColor` del tenant del usuario).
  - Refresh silencioso en `api-client` (`TODO(Fase 4)`).
  - Elegir la herramienta de generación de tipos desde el OpenAPI (DT-12) al conectar el login.
- **Fase 22**: `getTenantBranding()` del portal, por dominio.
- **Logo** de Adminprop: los slots de marca hoy muestran el texto "Adminprop".
