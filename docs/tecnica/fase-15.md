# Fase 15 — PDFs (frontend)

Contrato: `adminprop-repo-files/docs/REDISENO_FASE_15.md` (secciones 5 y 7). Decisiones DT-75 a DT-78.

## Qué se agregó

- `packages/shared-types/src/documents.ts`: `DocumentKind`, `DocumentStatus`, `GeneratedDocument`, `TenantSettings`, `UpdateTenantSettingsRequest`. Escritos a mano contra los nombres del rediseño; pasar a alias de `ApiSchemas` después de `npm run api:types` con el `openapi.json` de la Fase 15.
- `lib/documents-api.ts`: `fetchDocument(kind, entityId)` con espera (3 s / 30 s) y `useRegenerateDocument()`.
- `components/download-pdf-button.tsx`: botón con spinner y "Regenerar" opcional (admin).
- Botones reales en: liquidación, consolidado mensual, cada pago de una cuota ("Recibo") y contrato rescindido ("Cálculo de la rescisión").
- `lib/tenant-settings-api.ts` y `configuracion/inmobiliaria`: datos fiscales, bancarios, WhatsApp, pie de documentos, color de marca y logo (subida con vista previa).

## Pruebas

`documents-api.test.ts` (listo, pendiente que reintenta, fallido, tiempo agotado). Los tests de pantallas existentes siguen verdes (121 + 4 nuevos).

## Pendiente

- Portales (Fases 17 y 18): usar `DownloadPdfButton` equivalente con el cliente del portal.
- Regenerar tipos desde el OpenAPI cuando el backend de la 15 esté mergeado.
- **No visto en un navegador.**
