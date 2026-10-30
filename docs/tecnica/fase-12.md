# Fase 12 — Liquidaciones (frontend)

> Diseño: `adminprop-repo-files/docs/REDISENO_FASE_12.md` (reemplaza la spec `specs/fase-12-liquidaciones.md` con las respuestas de Micaela). Rama `feature/fase-12-liquidaciones`, **encadenada sobre `feature/fase-11-cobros`**. Backend: `adminprop-backend/docs/tecnica/fase-12.md`. Resumen para no programadores: [`../funcional/fase-12.md`](../funcional/fase-12.md).

Hecha **sin supervisión**, en paralelo con el backend contra los nombres de DTOs fijados en el prompt del agente (DT-58); tipos regenerados desde el `openapi.json` al final. Decisiones: DT-67 a DT-72.

## Rediseño sección 7 → dónde quedó

| Pedido                                                                              | Archivo                                                                                                                   |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/liquidaciones` con pestañas Liquidaciones / Consolidados / Honorarios             | `app/(dashboard)/liquidaciones/settlements-screen.tsx`; entrada "Liquidaciones" en el menú (en mobile, en "Más")          |
| Nueva liquidación (desde el listado y desde el contrato)                            | `liquidaciones/new-settlement-dialog.tsx`                                                                                 |
| Ficha: desglose, pagos y gastos incluidos, ajustes, confirmar, cancelar, transferir | `liquidaciones/[id]/settlement-detail.tsx`, `adjustment-dialog.tsx`, `transfer-dialog.tsx`                                |
| Consolidado: agregar/quitar liquidaciones, cerrar con modo de envío, reabrir        | `liquidaciones/consolidados/[id]/statement-detail.tsx`                                                                    |
| Honorarios pendientes y pago de honorarios                                          | pestaña "Honorarios" + `liquidaciones/fee-payment-dialog.tsx`                                                             |
| Ficha del propietario: historial, cuenta de honorarios, configuración (admin)       | `propietarios/[id]/owner-settlements-section.tsx`, `owner-fee-settings-dialog.tsx`                                        |
| Ficha del contrato: liquidaciones y devolución del depósito                         | `contratos/[id]/contract-settlements-section.tsx`, `deposit-return-dialog.tsx`; `account-section.tsx` muestra lo devuelto |
| Cuota saldada → link a su liquidación (cierra DT-56 para los pagos)                 | `cobros/[id]/installment-detail.tsx` ("Liquidado al propietario: ver liquidación")                                        |

## Qué quedó construido

- **Tipos** (`packages/shared-types/src/settlements.ts`): alias a `SettlementSummaryDto`, `SettlementDetailDto` (con `payments`, `expenses`, `skippedExpenses`, `adjustments`, `transfers`), `OwnerStatementSummaryDto`/`DetailDto`/`TotalsDto`, `FeeReceivableDto`, `FeePaymentDto`, `OwnerFeeAccountDto`, `OwnerFeeSettingsDto`, `DepositReturnDto`, requests; enums derivados (`SettlementStatus`, `SettlementAdjustmentConcept`, `StatementStatus`, `StatementSendMode`, `FeeReceivableSource`, `FeePayer`, `FeeReceivableStatus`, `DepositDeductionConcept`, `FeeAccountMovementType`). Los multipart (`transfers`, `fee-payments`) van a mano. `OwnerDetail` suma `feeSettings`; `PaymentDto` suma `settlementId`; `ContractAccountDto.deposit` suma `returned`; `PaymentMethod` suma `DEPOSIT`; `AccountMovementType` suma `DEPOSIT_RETURNED` y `DEPOSIT_DEDUCTION`.
- **Helpers** (`lib/settlements.ts`): badges de liquidación (gris pendiente, azul confirmada, verde transferida, rojo cancelada), de consolidado y de honorario a cobrar; etiquetas de conceptos de ajuste (`adjustmentSubtracts`: sólo `OTHER_CREDIT` suma), modo de envío, origen y pagador del honorario, deducciones del depósito, movimientos de la cuenta de honorarios; `settlementLabel` ("2026-10 · 2" para la segunda del mes).
- **Hooks** (`lib/settlements-api.ts`): liquidaciones (listado infinito con filtros, ficha, crear, recalcular, ajustar y anular ajuste, confirmar, cancelar, transferir multipart y anular transferencia, historial por propietario), consolidados (listado, ficha, candidatas, crear, agregar/quitar, cerrar, reabrir), honorarios (receivables, cuenta del propietario, pago multipart, anular, configuración del propietario), depósito (`useRegisterDepositReturn`). Toda mutación invalida `settlements`, `billing`, `advance-expenses` y `owners` (DT-68).
- **Pantalla**: filtros por propietario (`OwnerSelect`), propiedad, mes y estado; tabla/tarjetas con alquiler, honorarios (con signo si se descuentan), neto y transferido; badges "Con pago anulado" y "En consolidado". Consolidados con totales por moneda. Honorarios: lista de receivables con origen y quién paga, "Registrar pago" por propietario.
- **Ficha de liquidación**: desglose (alquiler, punitorios, cargos del propietario, honorarios con o sin descuento, gastos, ajustes, **neto**, transferido) y la nota de cómo se calcularon los honorarios (%, base o fijo prorrateado, términos mixtos) y de los cargos por servicios que no entran (A-16); aviso si el propietario no tiene cuenta bancaria (A-17); pagos incluidos por cuota; gastos descontados y los salteados por otra moneda; ajustes con anulación mientras está pendiente; transferencias con comprobante y anulación (admin). Acciones por estado: Recalcular / Agregar ajuste / Confirmar / Cancelar (admin) en pendiente; "Registrar transferencia" en confirmada o transferida con neto positivo; "Descargar PDF" deshabilitado hasta la Fase 15.
- **Consolidado**: totales por moneda, tabla de liquidaciones incluidas con quitar (abierto), "Agregar liquidaciones" con casillas sobre las candidatas, "Cerrar" con el modo de envío (default el del propietario), "Reabrir" (admin, cerrado).
- **Propietario**: `OwnerSettlementsSection` (historial con neto y estado) y `OwnerFeeAccountSection` (resumen de configuración, totales devengado/cobrado/pendiente/a cuenta por moneda, receivables pendientes, movimientos desplegables, "Registrar pago", "Configurar" admin → `OwnerFeeSettingsDialog`: % propio o regla del tenant, base con punitorios y/o cargos, modo de envío).
- **Contrato**: `ContractSettlementsSection` (sólo ofrece "Nueva liquidación" si cobra la inmobiliaria); "Devolver depósito" en la cuenta corriente cuando el contrato no está activo y aún no se devolvió, con deducciones (concepto, justificación, monto; una deuda se puede imputar a una cuota con saldo) y la validación de suma en la API (`DEPOSIT_RETURN_UNBALANCED` mapeado a mensaje).
- **Cobros**: cada pago liquidado linkea a su liquidación.

## Tests

| Archivo                                         | Qué cubre                                                                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `liquidaciones/settlements-screen.test.tsx`     | Listado con neto, honorarios descontados y badges; pestaña de consolidados; pestaña de honorarios con quién paga                                          |
| `liquidaciones/[id]/settlement-detail.test.tsx` | Desglose y aviso de cuenta bancaria; confirmar; empleado sin cancelar; transferencia con importe obligatorio; ajuste con concepto                         |
| Tests existentes ajustados                      | `contract-detail.test.tsx`, `owner-detail.test.tsx` (hooks de liquidaciones mockeados, `feeSettings` en el fixture), fixtures de pagos con `settlementId` |

Backoffice: 116 tests (6 nuevos). `npm run typecheck`, `npm run lint` y `npm test` en verde el 2026-10-30. **No verificado en un navegador logueado.**

## Pendiente

- Fase 15: "Descargar PDF" real en liquidaciones y consolidados.
- Fase 14: el modo de envío del consolidado se usa al mandar el email.
- Fase 17: el propietario ve lo mismo en su portal y acusa recibo.
- Fase 19: reportes de honorarios cobrados y liquidado por mes.
