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
  ui/                shadcn/ui compartido + theme (src/styles/theme.css)
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
npm install
npm run dev        # levanta las dos apps
npm run build
npm run lint
npm run typecheck
```

Para una sola app: `npx turbo run dev --filter=@adminprop/backoffice`.

## UI

- Agregar un componente shadcn: `cd packages/ui && npx shadcn@latest add <componente>`.
- Importar: `import { Button } from "@adminprop/ui/components/button"`.
- Colores: solo clases semánticas (`bg-primary`, `text-accent`, `bg-nav`…). Los hex viven únicamente en `packages/ui/src/styles/theme.css`.
- Tipografía: `font-serif` (títulos y precios) y `font-sans` (cuerpo e interfaz).

## Mocks → backend real

Mientras la API (`adminprop-backend`) no tenga el endpoint, las pantallas leen de `@adminprop/mocks` (`withLatency()` simula la red). Cuando un módulo tenga su endpoint, su `queryFn` pasa a usar `apiClient` (`src/lib/api-client.ts`) y el mock correspondiente se borra.

Decisiones técnicas del scaffold: `docs/DECISIONES_TECNICAS.md`.
