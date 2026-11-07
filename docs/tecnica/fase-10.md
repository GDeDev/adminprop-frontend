# Fase 10 — Servicios y gastos adelantados (frontend)

> Spec: `adminprop-repo-files/specs/fase-10-servicios.md`. Rama `feature/fase-10-servicios`, **encadenada sobre `feature/fase-09-contratos`**. Backend: `adminprop-backend/docs/tecnica/fase-10.md` (endpoints, nombres en inglés, códigos de error). Resumen para no programadores: [`../funcional/fase-10.md`](../funcional/fase-10.md).

Hecha **sin supervisión**: los cuatro primeros commits los hizo un subagente que murió con el apagón del 2026-10-29; el dashboard y las docs los cerró la sesión siguiente. Decisiones: DT-53 a DT-57.

## Spec sección 5 → dónde quedó

| Pedido                                                              | Archivo                                                                                                                 |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 5.1 Tabla de servicios en la ficha de propiedad                     | `app/(dashboard)/propiedades/[id]/services-section.tsx` (`ServicesSection`, tabla en desktop, tarjetas en mobile)       |
| 5.1 Alta rápida (bottom sheet) con campos condicionales             | `propiedades/[id]/service-form-dialog.tsx` (`ResponsiveDialog`: Drawer en mobile; fecha y frecuencia según interruptor) |
| Servicios del contrato con `scope` (D-66)                           | `contratos/[id]/contract-detail.tsx` reutiliza `ServicesSection` con `contractId` (DT-53, DT-54)                        |
| 5.2 Listado de gastos adelantados con comprobante descargable       | `contratos/[id]/advance-expenses-section.tsx` (pestañas Todos / Pendientes / Descontados, totales del contrato)         |
| 5.2 Alta con upload de comprobante (foto o PDF)                     | `contratos/[id]/advance-expense-dialog.tsx` (multipart; comprobante obligatorio, DT-55)                                 |
| 5.2 Badge "Pendiente de descuento" / "Descontado en liquidación #X" | `lib/services.ts` (`expenseStatusMeta`) + `ExpenseStatus`: id de la liquidación sin link hasta la Fase 12 (DT-56)       |
| Vencidos de toda la inmobiliaria (`GET /services/overdue`)          | `app/(dashboard)/dashboard/overdue-services.tsx` (DT-57)                                                                |
| Paso "servicios" del wizard de contratos (DT-46)                    | No se agregó: se cargan desde la ficha de la propiedad o del contrato ya creado (DT-53)                                 |

## Qué quedó construido

- **Tipos** (`packages/shared-types/src/service.ts`): `generated/api.ts` regenerado desde el `openapi.json` de la rama `feature/fase-10-servicios` del backend (`npm run api:types`). `PropertyService`, `ContractService` (con `scope`), `OverdueService` (con `property { id, address }`), `ServiceTypeRef`, `ServicePropertyRef`, `AdvanceExpense`, `AdvanceExpenseList` (`items`, `pendingTotal`, `settledTotal`), `AdvanceExpenseRegisteredBy`, requests `CreateServiceRequest`, `UpdateServiceRequest`, `UpdateAdvanceExpenseRequest` y enums derivados `ServicePayer`, `ServiceStatus`, `ServiceScope`, `IncreaseFrequency` (mismos valores que `RentUpdateFrequency`; la API los expone aparte).
- **Helpers** (`lib/services.ts`): etiquetas de quién paga, alcance y frecuencia (la frecuencia reutiliza `RENT_UPDATE_FREQUENCY_LABELS`); `serviceStatusMeta` (verde "Al día", rojo "Vencido hace N días", sin badge cuando el servicio no tiene vencimiento); `daysOverdueLabel`; `expenseStatusMeta` (amarillo pendiente, verde descontado); `MAX_RECEIPT_BYTES`, `RECEIPT_ACCEPT` y `receiptProblem` (JPG, PNG, WebP o PDF hasta 10 MB, por tipo MIME o extensión).
- **Hooks** (`lib/services-api.ts`): `usePropertyServices`, `useContractServices`, `useInfiniteOverdueServices` (paginado de a 20, filtro `propertyId`), `useCreateService` (con `contractId` es del contrato, sin él de la propiedad), `useUpdateService`, `useDeleteService`; `useAdvanceExpenses(contractId, settled?)`, `useCreateAdvanceExpense` (`FormData` con `amount`, `description`, `expenseDate`, `currency?`, `file`), `useUpdateAdvanceExpense`, `useDeleteAdvanceExpense`. Las mutaciones de servicios invalidan toda la clave `services` (propiedad, contratos y dashboard cambian juntos); las de gastos, sólo las del contrato.
- **`ServicesSection`** (compartida): columnas servicio (con "Tipo eliminado" o "(desactivado)" si el maestro cambió), quién paga y moneda, vencimiento ("Sin vencimiento"), estado, aumento ("Sin aumentos" o la frecuencia); marcas "Del contrato" / "De la propiedad" cuando viene con `scope` y "Gestiona la inmobiliaria" cuando `managedByAgency`. Editar y eliminar (con confirmación) por fila. "Agregar servicio" sólo si hay `propertyId`: con la propiedad eliminada se lista pero no se agrega.
- **`ServiceFormDialog`**: tipo de servicio con `MasterDataSelect` (maestro de tipos de servicio), quién paga, moneda (la del contrato por defecto desde la ficha del contrato), interruptor "Tiene vencimiento" que muestra la fecha, interruptor "Tiene aumentos" que muestra la frecuencia, "Lo gestiona la inmobiliaria", observaciones. El `superRefine` de zod repite las dos reglas de la API (fecha obligatoria con vencimiento, frecuencia obligatoria con aumentos) para avisar antes de mandar; los códigos `SERVICE_DUE_DATE_REQUIRED`, `SERVICE_INVALID_DATE`, `SERVICE_INCREASE_FREQUENCY_REQUIRED` y `SERVICE_INVALID_SERVICE_TYPE` vuelven al campo. Al editar manda `PATCH /services/:id` con todo el cuerpo.
- **`AdvanceExpensesSection`**: pestañas que pegan a `?settled=`; tabla / tarjetas con monto formateado, descripción, fecha, quién lo registró, "Ver comprobante" (nueva pestaña) y estado; totales "Pendiente de descuento" y "Ya descontado" del contrato entero sin importar la pestaña. Editar sólo pendientes; eliminar sólo pendientes y sólo admin (`useSession().user.role`), con confirmación.
- **`AdvanceExpenseDialog`**: monto (vista previa formateada vía `normalizeAmount` + `formatMoney`), moneda (la del contrato por defecto), "Qué se pagó", fecha (hoy por defecto) y comprobante (`<input type="file">` con `RECEIPT_ACCEPT`, validado con `receiptProblem` antes de mandar). En edición no se cambia el comprobante (la API no lo permite); `EXPENSE_ALREADY_SETTLED` (409) se muestra como error general.
- **`OverdueServices`** (dashboard): sección con contador, las cinco más atrasadas y "Ver todos", que muestra la página completa y sigue con `LoadMore`. Cada fila linkea a la propiedad y dice tipo, quién paga, fecha y "Vencido hace N días". El `ComingSoon` del dashboard sigue hasta la Fase 19.
- **Fichas**: `property-detail.tsx` suma `ServicesSection` después de las características; `contract-detail.tsx` reemplaza el placeholder "Servicios y gastos adelantados" por las dos secciones y conserva el de "Estado mes a mes" (Fase 11).

## Tests

| Archivo                                                                                | Qué cubre                                                                                                                                                                     |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/services.test.ts`                                                                 | Badges de servicio y gasto, "Vencido hace N días" singular/plural, etiquetas de frecuencia, `receiptProblem`                                                                  |
| `propiedades/[id]/services-section.test.tsx`                                           | Filas con quién paga, vencimiento, estado y alcance; vacío; sin propiedad no agrega; campos condicionales del alta; edición precargada y eliminación con confirmación         |
| `contratos/[id]/advance-expenses-section.test.tsx`                                     | Filas con comprobante, estado y totales; editar sólo pendientes y eliminar sólo admin; filtro `settled`; alta exige comprobante y manda el multipart con el monto normalizado |
| `dashboard/overdue-services.test.tsx`                                                  | Primeros vencidos con link y total; resumen de cinco + "Ver todos" + "Cargar más"; vacío                                                                                      |
| `propiedades/[id]/property-detail.test.tsx`, `contratos/[id]/contract-detail.test.tsx` | Las fichas muestran las secciones nuevas (hooks de servicios mockeados)                                                                                                       |

Backoffice: 93 tests (18 nuevos). `npm run typecheck`, `npm run lint` y `npm test` en verde en `apps/backoffice` el 2026-10-29. Con la suite completa en paralelo, `contract-form.test.tsx` (Fase 9) a veces supera los 5 s y falla por timeout; corrido solo pasa. **No verificado en un navegador logueado.**

## Pendiente

- Fase 11: "Estado mes a mes" en la ficha del contrato; los servicios que paga el inquilino entran en la cuota.
- Fase 12: link desde "Liquidación {id}" a la pantalla de la liquidación (DT-56); los gastos pendientes se descuentan al liquidar.
- Fase 13: alerta de servicio vencido a partir del 5.º día (la API ya calcula `daysOverdue`).
- Fase 19: el dashboard real absorbe `OverdueServices` como una tarjeta más.
- Paso "servicios" en el wizard de contratos: sigue sin hacerse (DT-53); la sección de la ficha cubre el caso.
