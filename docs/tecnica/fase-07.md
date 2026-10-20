# Fase 7 — Propietarios (frontend)

> Spec: `adminprop-repo-files/specs/fase-07-propietarios.md`. Rama `feature/fase-07-propietarios`, **encadenada sobre `feature/fase-06-propiedades`**. Backend: `adminprop-backend/docs/tecnica/fase-07.md`. Resumen para no programadores: [`../funcional/fase-07.md`](../funcional/fase-07.md).

Hecha **sin supervisión**. Decisiones: DT-38 a DT-41.

## Spec sección 5 → dónde quedó

| Pedido                                                 | Archivo                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| 5.1 Listado (tarjetas, cantidad de propiedades, badge) | `app/(dashboard)/propietarios/owner-list.tsx`                         |
| 5.1 Filtro "con deuda"                                 | No: llega con los cobros (Fase 11). Sólo búsqueda por nombre o DNI.   |
| 5.2 Ficha, datos bancarios con acción separada         | `propietarios/[id]/owner-detail.tsx`, `bank-account-dialog.tsx`       |
| 5.2 Sus propiedades con estado                         | `owner-detail.tsx` (sección Propiedades, con `StatusBadge` de Fase 6) |
| 5.2 Placeholder liquidaciones                          | `owner-detail.tsx`                                                    |
| 5.2 "Generar acceso a portal"                          | `propietarios/[id]/portal-credentials-dialog.tsx`                     |
| 5.3 Alta/edición con chequeo de DNI en vivo            | `propietarios/owner-form.tsx` (+ `bank-account-fields.tsx`)           |
| Propiedad ↔ propietario (pendiente de Fase 6)          | `components/owner-select.tsx`, paso 2 del wizard, ficha de propiedad  |

## Qué quedó construido

- **Tipos**: `packages/shared-types/src/owner.ts` ahora sale del contrato (`OwnerSummary`, `OwnerDetail`, `BankAccount`, `OwnerDataCheck`, `PortalCredentials`, requests). El `owner.ts` escrito a mano antes de la fase se reemplazó; `@adminprop/mocks` conserva su propio tipo local.
- **Hooks** (`lib/owners-api.ts`): listado infinito con `search`, ficha, chequeo en vivo (`GET /owners/check`, con `enabled` sólo si hay algo que chequear), alta, edición, cuenta bancaria, acceso al portal y baja. Las mutaciones que devuelven la ficha la guardan en cache e invalidan listado y propiedades.
- **Helpers** (`lib/owners.ts`): DNI con puntos / CUIT con guiones, CBU en dos bloques, "3 propiedades, 2 alquiladas".
- **Listado**: búsqueda con debounce, tarjetas en mobile y tabla en desktop, badge "Honorario reducido" (`reducedFee` calculado por la API), ícono de llave si tiene acceso al portal.
- **Ficha**: datos, cuenta bancaria (diálogo propio "Cargar/Cambiar"), propiedades con estado y link, acceso al portal (deshabilitado sin email), placeholder de liquidaciones, eliminar (sólo admin, con confirmación y el 409 de la API como toast).
- **Formulario**: una pantalla (no wizard). DNI con o sin puntos; si ya existe, avisa con link a la ficha y no deja guardar. En el alta, cuenta bancaria opcional con aviso de CBU compartido; en la edición, la cuenta sólo se cambia desde la ficha (D-40).
- **Propiedades**: `OwnerSelect` (combobox con búsqueda contra la API) en el paso 2 del wizard; `ownerId` viaja en alta y edición y se guarda en el borrador; la ficha muestra el propietario con link o "Asignar".

## Tests

| Archivo                                   | Qué cubre                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `propietarios/owner-list.test.tsx`        | DNI/CUIT formateado, cantidad de propiedades, badge, acceso al portal, links           |
| `propietarios/[id]/owner-detail.test.tsx` | CBU en bloques, propiedades, eliminar sólo admin, portal sin email, contraseña una vez |
| `propiedades/property-form.test.tsx`      | El wizard sigue creando con `ownerId: null` (selector mockeado)                        |

Backoffice: 35 tests. **No verificado en un navegador logueado** (la API local no estaba corriendo durante la fase); sí tipado contra el contrato real y probado con Testing Library.

## Pendiente

- Al recuperar un borrador del wizard con propietario elegido, el selector muestra "Propietario elegido" en vez del nombre (el borrador guarda sólo el id).
- Fase 11: filtro "con deuda" en el listado. Fase 12: historial de liquidaciones en la ficha. Fase 14: enviar la contraseña del portal por email.
