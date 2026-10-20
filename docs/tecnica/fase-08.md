# Fase 8 — Inquilinos y garantes (frontend)

> Spec: `adminprop-repo-files/specs/fase-08-inquilinos-garantes.md`. Rama `feature/fase-08-inquilinos`, **encadenada sobre `feature/fase-07-propietarios`**. Backend: `adminprop-backend/docs/tecnica/fase-08.md`. Resumen para no programadores: [`../funcional/fase-08.md`](../funcional/fase-08.md).

Hecha **sin supervisión**. Decisiones: DT-42 a DT-45.

## Spec sección 5 → dónde quedó

| Pedido                                                  | Archivo                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 5.1 Listado de inquilinos, badge de pago gris           | `app/(dashboard)/inquilinos/renter-list.tsx` (`PaymentBadge` "Sin datos")                        |
| 5.1 Filtros propiedad / estado de pago (deshabilitados) | `renter-list.tsx`: el de estado de pago está, deshabilitado; el de propiedad llega con la Fase 9 |
| 5.2 Ficha con garante expandido y link                  | `inquilinos/[id]/renter-detail.tsx`                                                              |
| 5.2 Placeholders contrato / pagos                       | `renter-detail.tsx`                                                                              |
| 5.2 Botón WhatsApp                                      | `lib/renters.ts` (`whatsappLink`) + `renter-detail.tsx`                                          |
| 5.3 Alta/edición con garante existente o nuevo inline   | `inquilinos/renter-form.tsx` + `components/guarantor-select.tsx`                                 |
| 5.4 Pantalla de garantes, tipo con campo condicional    | `app/(dashboard)/garantes/*` (`guarantor-form-dialog.tsx`)                                       |
| Acceso al portal (mismo patrón que Fase 7)              | `components/portal-credentials-dialog.tsx` (compartido)                                          |

## Qué quedó construido

- **Tipos** (`packages/shared-types/src/renter.ts`): desde el contrato. `RenterPaymentStatus` en vez de `PaymentStatus` para no chocar con el tipo de cobros (`payment.ts`). El mock de `@adminprop/mocks` conserva un tipo local.
- **Hooks** (`lib/renters-api.ts`): inquilinos y garantes con el mismo patrón que propietarios (listado infinito, ficha, chequeo en vivo de DNI, alta, edición, acceso al portal, baja). Las mutaciones de uno invalidan al otro (el garante lista a sus inquilinos; el inquilino muestra el nombre del garante).
- **Helpers** (`lib/renters.ts`): etiquetas del tipo de garantía y del estado de pago, `whatsappLink` (dígitos + código de país; un número argentino sin código se lleva a `549…`), `formatDate` sin pasar por `Date`.
- **Garantes**: `/garantes` (listado, búsqueda), `/garantes/[id]` (datos, garantía, inquilinos que garantiza, editar, eliminar admin) y `GuarantorFormDialog` (diálogo, con el campo de detalle rotulado según el tipo). Entrada "Garantes" en el menú (cajón "Más" en mobile).
- **Inquilinos**: `/inquilinos` (listado, búsqueda, badge de pago gris, filtro de estado deshabilitado), `/inquilinos/[id]` (datos, fecha de ingreso, garante expandido con link y WhatsApp, acceso al portal, placeholders, eliminar admin), `/inquilinos/nuevo` y `/inquilinos/[id]/editar` (una pantalla, chequeo de DNI en vivo, `GuarantorSelect` con "Crear un garante nuevo" que abre el diálogo y deja elegido al creado).
- **Compartido**: `PortalCredentialsDialog` generalizado (propietarios e inquilinos) y `LoadMore` extraído a `components/`.

## Tests

| Archivo                                  | Qué cubre                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lib/renters.test.ts`                    | `whatsappLink` con los formatos habituales (criterio 6 de la spec), `formatDate`         |
| `inquilinos/[id]/renter-detail.test.tsx` | Garante expandido con link, fecha de ingreso, WhatsApp, placeholder de pago, sin garante |
| `garantes/guarantor-list.test.tsx`       | Tipo y cantidad de inquilinos; el alta exige el detalle de la garantía                   |
| `propietarios/*` (Fase 7)                | Siguen en verde con el diálogo compartido                                                |

Backoffice: 42 tests. **No verificado en un navegador logueado.**

## Pendiente

- Fase 9: filtro por propiedad y "contrato activo" en la ficha. Fase 11: estado de pago real y filtro habilitado. Fase 14: enviar la contraseña por email.
- Al editar un inquilino y abrir el selector, el garante actual aparece con su nombre (`selectedLabel`); si se cambia y se vuelve a elegir el original, también.
