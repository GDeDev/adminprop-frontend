# Fase 25 — Inventario del inmueble (frontend)

Contrato: `adminprop-repo-files/docs/REDISENO_FASE_25.md`. Tipos a mano en `shared-types/src/inventory.ts` (son el contrato). Decisiones DT-83 a DT-85.

- Sección "Inventario del inmueble" en la ficha de contrato (`inventory-section.tsx`): tarjetas de entrega y devolución, estado, y acceso a la comparación.
- Editor móvil (`contratos/[id]/inventario/[inventoryId]`): ítems por categoría, estado en cuatro botones, observaciones, fotos con cámara (`capture="environment"`), guardar borrador y confirmar. Confirmado = sólo lectura + "Corregir".
- Comparación (`contratos/[id]/inventario/comparar`): tabla lado a lado, lo que empeoró resaltado, imprimible.
- Hooks en `lib/inventory-api.ts`, helpers y tests en `lib/inventory.ts`.
- **No visto en un navegador; depende del backend de la Fase 25.**
