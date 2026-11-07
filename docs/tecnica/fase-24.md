# Fase 24 — Tasación automática de alquiler (frontend)

Contrato: `adminprop-repo-files/docs/REDISENO_FASE_24.md`. Tipos a mano en `shared-types/src/valuation.ts`. Decisiones DT-104 a DT-106.

- `lib/valuation-api.ts` (TanStack Query: tasar, historial paginado, cobertura de zona, estado del mercado) y `lib/valuation.ts` (armado y validación del pedido, `markerPosition`, `dataAgeLabel`, etiquetas de confianza y de estado de fuente).
- Ficha de propiedad: `AppraisalSection` («Historial de tasaciones» + botón «Sugerir precio») y `AppraisalSheet` (`ResponsiveDialog`, bottom sheet en mobile): superficie, ambientes y moneda; aviso «Todavía hay pocos datos de esta zona» según la cobertura; resultado con barra de rango y precio sugerido marcado, chip de confianza, cantidad de avisos, antigüedad del más viejo, zona ampliada y justificación; «Descartar» y, si el padre pasa `onUse`, «Usar este precio» (no guarda).
- Configuración → Automatizaciones: tarjeta «Datos de mercado» (`MarketStatusCard`) con el estado de cada fuente. El job global `valuation.refresh-comparables` aparece solo en la lista de automatizaciones (viene del catálogo).
- Tests: `lib/valuation.test.ts`, `propiedades/[id]/appraisal-section.test.tsx` (historial, flujo calcular/usar, errores de la API, validación), `automatizaciones/market-status-card.test.tsx`.
- Depende del backend (aún no existe): los cuatro endpoints de `/valuation/*` listados en DT-104, con sus códigos de error, y el job `valuation.refresh-comparables` en el catálogo de Fase 13.
- Pendiente: montar el sheet con `onUse` en el wizard cuando exista el campo de precio (Fase 22); botón para refrescar una zona (`POST /valuation/zones/refresh`) si se pide. **No visto en un navegador** (sin API).
