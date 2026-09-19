# Fase 5 — Maestros (frontend)

> Spec: `../adminprop-repo-files/specs/fase-05-maestros.md`. Rama `feature/fase-05-maestros`, **encadenada sobre `feature/fase-04-auth`**.
> Backend: `adminprop-backend/docs/tecnica/fase-05.md`. Resumen no técnico: [`../funcional/fase-05.md`](../funcional/fase-05.md).

Hecha **sin supervisión**. Decisiones: [`../DECISIONES_TECNICAS.md`](../DECISIONES_TECNICAS.md), DT-30 a DT-33.

## Spec sección 6 → dónde quedó

| Pedido                                                       | Dónde                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Configuración > Maestros con tabs                            | `apps/backoffice/src/app/(dashboard)/configuracion/maestros/`       |
| Ubicaciones como árbol expandible                            | `maestros/location-tree.tsx`                                        |
| Resto: listado con toggle activo y alta rápida (modal/sheet) | `maestros/catalog-panel.tsx` + `name-dialog.tsx` (ResponsiveDialog) |
| `<MasterDataSelect>` reutilizable, único y múltiple          | `apps/backoffice/src/components/master-data-select.tsx`             |

## Qué quedó construido

- **Tipos:** `shared-types/src/master-data.ts` pasa a los generados del OpenAPI (`CatalogItem`, `Location`, `LocationNode`, `CatalogKey`). Los mocks se adaptaron.
- **Datos:** `src/lib/master-data-api.ts` (React Query): `useCatalog`, `useLocations`, `useLocationTree` y mutaciones. Cache de 5 minutos; cualquier cambio invalida todo lo de maestros.
- **Pantalla:** una pestaña por maestro (desplazables en mobile). Planos: lista con contador de activos, ícono en amenities, editar, switch de activo y "Agregar". Ubicaciones: árbol con países abiertos, "+" para agregar el nivel siguiente, renombrar y switch; al reactivar bajo un padre desactivado avisa (spec, casos borde).
- **Permisos:** todo el staff ve; sólo admin edita. Configuración ahora enlaza a Maestros.

### Cómo se usa `<MasterDataSelect>` (para la Fase 6)

```tsx
<MasterDataSelect source="property-types" value={typeId} onChange={setTypeId} />
<MasterDataSelect source="amenities" multiple value={amenityIds} onChange={setAmenityIds} />

// Cascada de ubicación
<MasterDataSelect source="locations" level="PROVINCE" value={provinceId} onChange={setProvinceId} />
<MasterDataSelect source="locations" parentId={provinceId ?? undefined} value={cityId}
  onChange={setCityId} disabled={!provinceId} />
```

## Tests

| Archivo                                  | Qué cubre                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `components/master-data-select.test.tsx` | opciones desde la API, único, múltiple, desactivados, filtro de ubicaciones (criterio 7) |
| `maestros/master-data-screen.test.tsx`   | admin desactiva, empleado sólo lee, aviso al reactivar bajo padre desactivado            |

Backoffice: 21 tests. Typecheck, lint y build en verde.

**No verificado en un navegador logueado** (la extensión de Chrome no estaba conectada): revisar la pantalla en mobile y desktop.
