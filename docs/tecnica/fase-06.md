# Fase 6 — Propiedades (frontend)

> Spec: `../adminprop-repo-files/specs/fase-06-propiedades.md`. Rama `feature/fase-06-propiedades`, **encadenada sobre `feature/fase-05-maestros`**.
> Backend: `adminprop-backend/docs/tecnica/fase-06.md`. Resumen no técnico: [`../funcional/fase-06.md`](../funcional/fase-06.md).

Hecha **sin supervisión**. Decisiones: [`../DECISIONES_TECNICAS.md`](../DECISIONES_TECNICAS.md), DT-34 a DT-37.

## Spec sección 5 → dónde quedó

| Pedido                                                        | Dónde                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| Listado: tarjetas / tabla, filtros, búsqueda, infinite scroll | `app/(dashboard)/propiedades/property-list.tsx`        |
| Ficha: carrusel, datos, amenities, placeholders               | `app/(dashboard)/propiedades/[id]/property-detail.tsx` |
| Alta/edición en wizard con borrador local                     | `app/(dashboard)/propiedades/property-form.tsx`        |
| Ubicación en cascada con `<MasterDataSelect>`                 | `components/location-cascade-select.tsx`               |

## Qué quedó construido

- **Tipos:** `PropertySummary`, `PropertyDetail` y requests, generados. La forma vieja pasa a `@adminprop/mocks` como `MockProperty` (la usa el portal público hasta la Fase 22).
- **Datos:** `src/lib/properties-api.ts` con `useInfiniteQuery` para el listado. Cada mutación devuelve la ficha: se guarda en la cache sin otro request y se invalida el listado.
- **Listado:** búsqueda con 300 ms de demora, filtros por estado y tipo, scroll infinito con `IntersectionObserver` y un botón "Cargar más" para teclado y lectores de pantalla.
- **Ficha:** carrusel con scroll-snap (sin librería), estado con las transiciones permitidas, fotos (agregar y quitar, hasta 20), borrar (sólo admin), lugares para propietario, contrato y pagos.
- **Wizard:** 4 pasos (datos, propietario "asignar después", amenities y notas, fotos). En el alta guarda un borrador en `localStorage`; la edición usa los tres primeros pasos y las fotos se manejan en la ficha.
- `MasterDataSelect`: ya no pide todas las ubicaciones mientras una cascada espera el nivel anterior.

## Tests

| Archivo                                     | Qué cubre                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| `propiedades/property-form.test.tsx`        | validación por paso, alta completa con fotos, borrador guardado y recuperado    |
| `propiedades/[id]/property-detail.test.tsx` | sin fotos, dato histórico desactivado, transiciones, botón de borrar sólo admin |

Los tests encontraron un bug antes del commit: el borrador se validaba con las reglas del formulario y se descartaba siempre.

**No verificado en un navegador logueado.** Revisar: el listado en mobile (criterio: tarjetas sin scroll horizontal), el carrusel y el wizard.
