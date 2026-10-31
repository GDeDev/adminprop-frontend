# Fase 13 — Automatizaciones (frontend)

> Diseño: `adminprop-repo-files/docs/REDISENO_FASE_13.md`. Rama `feature/fase-13-cron`, **encadenada sobre `feature/fase-12-liquidaciones`**. Backend: `adminprop-backend/docs/tecnica/fase-13.md`. Resumen para no programadores: [`../funcional/fase-13.md`](../funcional/fase-13.md).

Construida en paralelo con el backend contra los nombres de DTOs fijados en el diseño (sección 8); tipos regenerados desde el `openapi.json` de la fase. Decisiones: DT-73 y DT-74.

## Dónde quedó cada pedido

| Pedido                                                                                      | Archivo                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Configuración → Automatizaciones: jobs, última corrida, próxima, ejecutar a mano, historial | `configuracion/automatizaciones/automations-screen.tsx` (sólo admin)     |
| Estado de la traída de índices y "Traer ahora"                                              | `configuracion/indices/index-status.tsx`, dentro de `indices-screen.tsx` |
| Avisos internos en el tablero                                                               | `dashboard/internal-alerts.tsx`                                          |
| Hooks y claves de caché                                                                     | `lib/automations-api.ts`                                                 |
| Etiquetas, badges y fechas relativas                                                        | `lib/automations.ts`                                                     |
| Entrada en Configuración                                                                    | `configuracion/settings-index.tsx`                                       |

## Qué quedó construido

- **Tipos** (`packages/shared-types/src/automations.ts`): alias a `JobDto`, `JobExecutionDto`, `RunJobDto`, `RunJobResultDto`, `InternalAlertDto` e `IndexStatusDto`; los enums (`JobExecutionStatus`, `JobTrigger`, `JobScope`, `InternalAlertType`, `IndexFetchStatus`) se derivan de ahí.
- **Jobs**: tabla (tarjetas en mobile) con título, frecuencia legible, última ejecución con badge de estado y próxima corrida. "Ejecutar ahora" abre un diálogo; sólo `installments.generate` y `settlements.statement-reminder` piden un mes (`PERIOD_JOBS`), validado como AAAA-MM. La corrida responde 202 con `executionId` y el historial se refresca.
- **Historial**: listado infinito con filtros por job y por estado; muestra afectados, resumen, error y quién lo disparó (cron o usuario).
- **Índices**: panel con el último valor, fuente, último intento y su error; "Traer ahora" dispara el job de índices. Si el proveedor es `manual`, lo aclara.
- **Avisos internos**: tarjeta en el tablero con los no leídos, marcar uno o todos como leídos y link a la entidad.

## Tests

| Archivo                                        | Qué cubre                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `automatizaciones/automations-screen.test.tsx` | Listado de jobs, ejecución manual con y sin mes, bloqueo a quien no es admin, historial y filtros |
| `dashboard/internal-alerts.test.tsx`           | Avisos no leídos, marcar leído y marcar todos                                                     |
| `indices/indices-screen.test.tsx`              | Panel de estado junto a la carga manual                                                           |

Backoffice: 121 tests. `npm run typecheck`, `npm run lint` y `npm test` en verde el 2026-10-31. **No verificado en un navegador logueado.**

## Pendiente

- Fase 14: los avisos al personal sin destinatario se registran sin email hasta que se defina a quién.
- Las fuentes de índices (BCRA e INDEC) no se probaron contra internet; la primera corrida real puede dar `FAILED` y queda la carga manual.
