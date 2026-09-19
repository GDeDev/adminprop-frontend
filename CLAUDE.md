# CLAUDE.md — adminprop-frontend

Lineamientos generales del proyecto (fuente única de verdad, no duplicar acá):

@../adminprop-repo-files/CLAUDE.md

> Las rutas que menciona ese archivo (`docs/PRD.md`, `specs/`, `packages-ui-source/`) son relativas a `../adminprop-repo-files/`.
> Lo que sí vive en este repo: `docs/tecnica/`, `docs/funcional/` y `docs/DECISIONES_TECNICAS.md` del frontend.

## Alcance de este repo

- Solo frontend: `apps/backoffice`, `apps/portal` y `packages/*`. El backend es otro repo (`../adminprop-backend`) con su propio git: nunca mezclar cambios de los dos en un commit.
- Desde la Fase 6 cada fase es un vertical slice: primero el backend, después la parte de acá.
- **Dinero:** el frontend no calcula montos. La API los manda como string y acá solo se formatean.
- **Tipos del contrato HTTP:** se generan desde el OpenAPI de la API, no se escriben a mano en paralelo al backend.
- **Sistema de diseño:** integrado en `packages/ui` (Fase 3). Reglas: `../adminprop-repo-files/packages-ui-source/ADMINPROP-UI.md`; resumen de uso en el README, sección "UI".
  - Tokens: `packages/ui/src/styles/adminprop.css` es copia textual del sistema de diseño; no se edita a mano.
  - Después de un `shadcn add`, `npm test -w @adminprop/ui` (`design-rules.test.ts`) marca lo que hay que ajustar (`hover:bg-accent` → `hover:bg-muted`, etc.).
  - Diálogos: `ResponsiveDialog` (Drawer en mobile). Navegación: `AppSidebar` + `BottomNav`. Vacíos: `EmptyState`.
- **Tests:** Vitest (`npm test`). El pre-commit corre Prettier, ESLint (`--max-warnings=0`) y `vitest related`.
