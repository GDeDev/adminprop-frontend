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
- Sistema de diseño: `../adminprop-repo-files/packages-ui-source/` (se integra en `packages/ui` en la Fase 3).
