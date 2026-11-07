# Fase 21 — Migración de datos (frontend)

Contrato: `adminprop-repo-files/docs/REDISENO_FASE_21.md`. Tipos a mano en `shared-types/src/migration.ts`. Decisiones DT-94 a DT-97.

- `lib/migration-api.ts` (TanStack Query, endpoints exactos del rediseño sección 5; `useBatch` con polling mientras el lote analiza o importa; descargas por blob), `lib/migration.ts` (etiquetas, estados, `batchPhase`, `confirmSummary`, validación del archivo, mensajes de error por código).
- `/configuracion/migracion` (admin): tarjetas Desde Excel (plantilla + subida con validación de extensión y 10 MB) y Desde Tokko (cantidad máxima e incluir fotos), e historial de lotes con filtros.
- `/configuracion/migracion/[id]?job=`: stepper de 5 pasos; panel de progreso (`useJobStatus`), revisión (contadores por entidad, avisos de hojas faltantes y maestros a crear, filas filtrables por entidad/estado/"A revisar", errores en línea, resolución de conflictos, exclusión, reporte, descartar, diálogo de confirmación) y resultado (importadas / fallidas / fotos, reintentar fotos, enlace a propiedades a revisar, detalle por fila de sólo lectura).
- Enlace desde Configuración (sólo administradores). Mobile: filas como tarjetas, pasos en una línea con sólo el actual nombrado.
- Tests: `lib/migration.test.ts` (lógica) y `migracion/migration-screen.test.tsx` (subida, filas, revisión/confirmación, progreso).
- Depende del backend (aún no existe): todos los endpoints de `/migration/*`, `/jobs/:id/status` para análisis, importación y `migration-assets`, `canConfirm` en el detalle, `counts.byEntity.valid` sin las filas excluidas, y el filtro `needsReview` en el listado de propiedades.
- **No visto en un navegador** (sin API).
