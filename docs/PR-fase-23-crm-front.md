# feat(backoffice): frontend de la Fase 23 (CRM y multipublicación)

Encadenada sobre la Fase 24 (`feature/fase-24-tasacion-automatica`). Contrato: `adminprop-repo-files/docs/REDISENO_FASE_23.md` y `packages/shared-types/src/crm.ts` / `listings.ts` (no se tocaron).

## Qué incluye

La rama ya traía el tablero, el detalle, el alta manual, los canales, la sección de publicación y la tarjeta del dashboard (DT-98 a DT-103). Este PR completa lo que faltaba y lo endurece:

- **Analítica con gráficos** (DT-107, DT-108): barras diarias de vistas y consultas con período de 7/30/90 días, consultas por etapa y por origen, y «Embudo y orígenes» en el resumen del CRM. SVG propio, sin dependencias nuevas, solo tokens de color, con texto, ejes y tabla alternativa. La UI aclara que las vistas cuentan desde la activación.
- **Tablero** (DT-110): arrastre táctil (`TouchSensor`), asa de 44 px, «Mover a…» también en escritorio y estado vacío.
- **Filtros**: componente propio y mapeo puro a parámetros de la API, con tests.
- **Detalle**: registro de llamado y email como intento de contacto.
- **Canales y publicaciones** (DT-109): los errores del portal no se muestran crudos.
- **Tests**: movimiento optimista con rollback, tablero, filtros, detalle, estados de la pantalla, canales y gráficos.
- **Docs**: `docs/tecnica/fase-23.md`, `docs/funcional/fase-23.md` ampliados, DT-107 a DT-110.

## Qué no se pudo verificar

- Nada se vio en un navegador ni contra la API real: no hay backend de la Fase 23 en esta sesión.
- El arrastre real con mouse, dedo y teclado y el renderizado de los gráficos (contraste, escala, modo oscuro) no se ejercieron; jsdom no los cubre.
- Los endpoints `/crm/*` se usan tal como los describe el rediseño; si el backend difiere, hay que ajustar `lib/crm-api.ts` y `lib/listings-api.ts`.

## Supuestos

| Id     | Supuesto                                                                                | Dónde                                |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------ |
| DT-99  | `beforeId` es la tarjeta de arriba y `afterId` la de abajo del lugar elegido            | `lib/crm.ts` (`neighborsAt`)         |
| DT-101 | Se abre la pestaña de WhatsApp antes de pedir el link y se cierra si `url` es `null`    | `crm/inquiry-card.tsx`               |
| DT-102 | «Actualizar publicación» llama a `…/listings/:channel/publish`                          | `lib/listings-api.ts`                |
| DT-103 | La tarjeta «sin atender» cuenta sobre las hasta 50 tarjetas cargadas de `NEW`           | `dashboard/unattended-inquiries.tsx` |
| DT-107 | `daily` puede omitir días sin movimiento; el front rellena con 0                        | `lib/charts.ts`                      |
| DT-107 | La analítica por propiedad acepta `from`/`to` con fechas `YYYY-MM-DD`                   | `lib/crm-api.ts`                     |
| DT-108 | El contrato no trae la fecha de activación de las vistas, así que el texto no la nombra | `components/property-analytics.tsx`  |
| DT-109 | `lastError` puede traer texto técnico; se oculta con una heurística                     | `lib/listings.ts`                    |
| DT-110 | El backend acepta `PHONE` y `EMAIL` en `contact-attempts` (lo dice el contrato)         | `crm/inquiry-drawer.tsx`             |

## Notas para quien revise

- La rama de trabajo se llama `feature/fase-23-crm-front-ui` porque `feature/fase-23-crm-front` ya estaba tomada por otro worktree.
- `apps/backoffice/.vitest/` es caché local y no está en el commit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01GhBUKJBqXbBFxfDrfiiXnz
