# Adminprop

SaaS multi-tenant de gestión inmobiliaria. Monorepo Turborepo.

Leer primero `CLAUDE.md`, `docs/PRD.md` y `specs/fase-01-arquitectura.md`.

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

Mientras no exista `apps/api`, las pantallas leen de `@adminprop/mocks` (`withLatency()` simula la red). Cuando un módulo tenga su endpoint, su `queryFn` pasa a usar `apiClient` (`src/lib/api-client.ts`) y el mock correspondiente se borra.

Decisiones técnicas del scaffold: `docs/DECISIONES_TECNICAS.md`.
