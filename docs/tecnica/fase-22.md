# Fase 22 — Portal público (frontend)

Contrato: `adminprop-repo-files/docs/REDISENO_FASE_22.md`. Tipos a mano en `shared-types/src/public-listing.ts`. Decisiones DT-86 a DT-88.

- `apps/portal/src/lib/public-api.ts` (servidor, `revalidate: 60`) y `public-format.ts` (parseo de filtros, precio, tests).
- Home con filtros en la URL (`ListingFilters`), tarjetas con foto, precio, ambientes y amenities; ficha con fotos, descripción, características y `ContactForm`.
- Se borró `lib/public-properties.ts` (datos de prueba).
- Corrección de tipos de las ramas de portales (`DEPOSIT`, `currency` en gastos).
- pendiente: campos de precio/descripción pública en el wizard del backoffice (cuando se regeneren los tipos) y backend de la Fase 22. **No visto en un navegador.**
