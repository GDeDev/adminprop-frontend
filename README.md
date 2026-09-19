# Adminprop

SaaS multi-tenant de gestión inmobiliaria. Monorepo Turborepo.

Frontend de Adminprop. El backend vive en otro repo (`adminprop-backend`).

La documentación del proyecto (PRD, specs, sistema de diseño) vive en `../adminprop-repo-files/`, no en este repo. Leer primero `CLAUDE.md`.

## Estructura

```
apps/
  backoffice/        Next.js — backoffice interno (admin/empleado). :3001
  portal/            Next.js — sitio público (SSG) + portales propietario/inquilino. :3002
packages/
  ui/                Sistema de diseño: shadcn/ui (new-york) + tokens + componentes propios
  shared-types/      Tipos TS del dominio (PRD sección 5, en inglés)
  mocks/             Fixtures DESCARTABLES para maquetar sin backend
  eslint-config/     ESLint compartido
  typescript-config/ tsconfig base
```

## Variables de entorno

No hay archivos `.env`. Las variables salen de Doppler (proyecto `admin-prop`):
cada app tiene su config (`dev_backoffice`, `dev_portal`), vinculada por carpeta
con `doppler setup` dentro de `apps/<app>`. Los scripts `dev`, `build` y `start`
de cada app ya corren dentro de `doppler run --`.

- `NEXT_PUBLIC_*` sólo para valores no sensibles: terminan en el bundle del navegador.
- Los secretos reales, sólo en Server Actions o Route Handlers.
- `build` no se cachea en turbo: las variables entran por Doppler dentro del
  script y turbo no las ve, así que un cache podría servir un bundle con una
  `NEXT_PUBLIC_API_URL` vieja.

## Comandos

```bash
npm install          # también instala el hook de pre-commit (Husky)
npm run dev          # levanta las dos apps (con Doppler)
npm run build
npm run lint         # falla con cualquier warning
npm run typecheck
npm test             # Vitest en packages/ui y las dos apps
npm run format:check
```

Para una sola app: `npx turbo run dev --filter=@adminprop/backoffice`.

**Pre-commit:** sobre los archivos staged corre Prettier, ESLint y los tests
relacionados (`vitest related`). Si algo falla, el commit no entra.
**CI** (`.github/workflows/ci.yml`): formato, lint, tipos, tests, build de las
dos apps y `npm audit`.

## UI

Reglas completas: `../adminprop-repo-files/packages-ui-source/ADMINPROP-UI.md`
(leerlo antes de tocar cualquier pantalla).

- Tokens: `packages/ui/src/styles/adminprop.css` es copia textual del sistema
  de diseño. **No se edita**: si cambia el diseño, se vuelve a copiar entero.
- Colores: solo clases semánticas (`bg-primary`, `bg-muted`, `text-success`,
  `bg-sidebar`…). Nunca un hex en un componente. `accent` es la arena de la
  marca, **no** el hover: el hover es `muted`.
- Tipografía: `font-display` (Outfit: títulos y montos) y `font-sans`
  (Figtree: el resto). Montos: `font-display tabular-nums`, a la derecha.
- Estados del dominio: `<Badge variant="disponible|alquilada|mantenimiento|mora|borrador">`.
- Navegación: `AppSidebar` (desde `md:`) y `BottomNav` (mobile, máx. 5).
- Mobile = Drawer: para diálogos usar `ResponsiveDialog`.
- Vacíos: `EmptyState`. Carga: `Skeleton` con la forma del contenido.
- Tema por inmobiliaria: `tenantThemeStyle(primaryColor)` en el `<html>`
  (root layout). Ningún componente se entera.
- Agregar un componente shadcn: `cd packages/ui && npx shadcn@latest add <componente>`.
  Después correr `npm test -w @adminprop/ui`: `design-rules.test.ts` marca
  los `hover:bg-accent` y demás cosas a corregir.
- Importar: `import { Button } from "@adminprop/ui/components/button"`.
- **Vitrina:** con el backoffice en dev, `http://localhost:3001/design-system`
  muestra todo el sistema, el modo oscuro y un simulador de color por
  inmobiliaria (no existe en producción).

## Mocks → backend real

Mientras la API (`adminprop-backend`) no tenga el endpoint, las pantallas leen de `@adminprop/mocks` (`withLatency()` simula la red). Cuando un módulo tenga su endpoint, su `queryFn` pasa a usar `apiClient` (`src/lib/api-client.ts`) y el mock correspondiente se borra.

Decisiones técnicas: `docs/DECISIONES_TECNICAS.md`. Fases cerradas: `docs/tecnica/` y `docs/funcional/`.
