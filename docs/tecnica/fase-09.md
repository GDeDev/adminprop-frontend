# Fase 9 — Contratos (frontend)

> Spec: `adminprop-repo-files/specs/fase-09-contratos.md`. Rama `feature/fase-09-contratos`, **encadenada sobre `feature/fase-08-inquilinos`**. Backend: `adminprop-backend/docs/tecnica/fase-09.md` (endpoints, nombres en inglés y códigos de error). Resumen para no programadores: [`../funcional/fase-09.md`](../funcional/fase-09.md).

Hecha **sin supervisión**. Decisiones: DT-46 a DT-52.

## Spec sección 5 → dónde quedó

| Pedido                                                   | Archivo                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 5.1 Listado con filtros por estado, propiedad, inquilino | `app/(dashboard)/contratos/contract-list.tsx` + `components/{property-select,renter-select}.tsx`        |
| 5.1 Filtro de vencimiento                                | Interruptor "Sólo por vencer" (`expiringSoon=true`, umbral del tenant)                                  |
| 5.1 Badge verde / amarillo / rojo                        | `lib/contracts.ts` (`contractStatusMeta`) + `ContractBadges` (con "Caución vencida")                    |
| 5.2 Timeline inicio → hoy → fin                          | `contratos/[id]/contract-detail.tsx` (`Timeline`, con `Progress` y `timeline.progressPercent`)          |
| 5.2 Caución con badge de vencimiento de póliza           | `contract-detail.tsx` (`SuretySection`) + `policyExpiryMeta`                                            |
| 5.2 Estado mes a mes (placeholder)                       | `contract-detail.tsx` (`Placeholder`, Fase 11); también "Servicios y gastos adelantados" (Fase 10)      |
| 5.2 Botones PDF contrato, póliza, rescindir, renovar     | `contratos/[id]/document-upload.tsx`, `terminate-dialog.tsx`, link a `/contratos/[id]/renovar`          |
| Aplicar aumento (spec 3.8)                               | `contratos/[id]/rent-update-dialog.tsx`                                                                 |
| Editar (notas, garante, caución; D-55)                   | `contratos/[id]/edit-contract-dialog.tsx` (también exporta `SuretyFields` para el wizard)               |
| 5.3 Wizard de alta                                       | `contratos/contract-form.tsx` (5 pasos, borrador en `localStorage`), ruta `/contratos/nuevo`            |
| 5.3 Paso 5 "servicios"                                   | No: va en la Fase 10 (DT-46). El paso 5 es fechas + PDF.                                                |
| 3.7 Renovación                                           | `contratos/[id]/renovar/renew-contract.tsx` → el mismo wizard con `original` (DT-48)                    |
| 5.4 Rescisión con vista previa y confirmación            | `terminate-dialog.tsx` + `useTerminationPreview` (DT-49)                                                |
| Índices ICL/IPC (spec 3.8, D-54)                         | `configuracion/indices/indices-screen.tsx`, tarjeta en `settings-index.tsx` (sólo admin)                |
| Contrato activo en las fichas de propiedad e inquilino   | `propiedades/[id]/property-detail.tsx`, `inquilinos/[id]/renter-detail.tsx` (reemplazan el placeholder) |

## Qué quedó construido

- **Tipos** (`packages/shared-types/src/contract.ts`): desde el contrato generado (`npm run api:types`): `ContractSummary`, `ContractDetail`, `ContractRentUpdate`, `ContractSurety`, `ContractTermination`, `ContractTimeline`, `TerminationPreview`, `TerminationResult`, `IndexValue`, requests y enums (`ContractStatus`, `RentUpdateType`, `RentUpdateFrequency`, `RentUpdateSource`, `IndexType`). `Currency` sigue en `common.ts` (mismos valores). El `contract.ts` escrito a mano antes de la fase se reemplazó; `@adminprop/mocks` conserva `MockContract` en `contract.type.ts`. Al regenerar, `activeContractId` pasó a ser obligatorio en propiedades e inquilinos (fixtures de tests actualizados).
- **Fechas** (`lib/dates.ts`): `formatDate` salió de `lib/renters.ts` (ahora compartido), más `formatPeriod` (AAAA-MM), `isIsoDate`, `todayIso`, `daysBetween` y `addDays` en UTC (sin desfase de zona horaria).
- **Helpers** (`lib/contracts.ts`): `contractStatusMeta` (badge por estado, DT-50), etiquetas de tipo/frecuencia/origen/moneda/índice, `formatMoney` (sólo `Intl.NumberFormat`, DT-51), `normalizeAmount` (acepta "480.000,50" y manda "480000.50"), `timelineLabel`, `nextStepLabel`, `policyExpiryMeta` (30 días de aviso), `documentProblem` (PDF hasta 10 MB).
- **Hooks** (`lib/contracts-api.ts`): listado infinito con `status`, `propertyId`, `renterId`, `ownerId`, `expiringSoon`; ficha; alta; edición; renovación; aumento; subida de PDF (contrato o póliza, multipart `file`); rescisión; `useTerminationPreview(id, notifiedAt)` sólo con fecha completa; índices (listar y cargar). Las mutaciones guardan la ficha en cache e invalidan contratos, propiedades e inquilinos (cambian de estado y de "contrato activo"). `useProperty` y `useRenter` ganaron un `enabled` opcional para el wizard.
- **Selectores** (`components/property-select.tsx`, `components/renter-select.tsx`): mismo patrón que `OwnerSelect` (DT-41), con `withoutActiveContract` para el alta (DT-47).
- **Listado**: filtros (estado, propiedad, inquilino, "Sólo por vencer"), tarjetas en mobile y tabla en desktop, período `dd/mm/aaaa → dd/mm/aaaa`, alquiler vigente formateado, badge de estado y "Caución vencida".
- **Ficha**: cabecera con badges y acciones (Editar siempre; Aplicar aumento, Renovar y Rescindir sólo activos), línea de tiempo, Partes (con links), Condiciones (más "qué sigue": próximo aumento, pendiente, vencido), Caución (badge de póliza, subir/reemplazar/ver póliza), Documento del contrato (subir/reemplazar/ver PDF), Rescisión (si la hubo), Historial de aumentos (tabla con índice y períodos), placeholders de Fase 10 y 11.
- **Wizard** (`ContractForm`): Propiedad (sólo sin contrato activo; muestra el propietario o avisa que falta) → Inquilino y garante (sólo sin contrato activo; el garante se precarga del inquilino) → Condiciones (alquiler con vista previa formateada, moneda, tipo y frecuencia, depósito) → Caución (interruptor; con caución el email es obligatorio, validado con zod y también por código de la API) → Fechas, notas y PDF (se sube después de crear, como las fotos). Errores de la API por campo y por código (`CONTRACT_PROPERTY_ALREADY_RENTED`, `CONTRACT_RENTER_ALREADY_ACTIVE`, `CONTRACT_PROPERTY_WITHOUT_OWNER`, `CONTRACT_SURETY_EMAIL_REQUIRED`, `CONTRACT_DATES_INVALID`, `CONTRACT_RENEWAL_START_INVALID`, …) vuelven al paso del primer campo con error. Con `original` es la renovación: propiedad fija, inquilino editable, alquiler inicial = vigente, inicio = día siguiente al fin del original, y manda `POST /contracts/:id/renew`.
- **Índices**: `/configuracion/indices` con pestañas ICL/IPC (mes, valor, origen, fecha de carga) y, para admin, el formulario `{ indexType, period, value }` (409 "ya cargado" al campo mes). La tarjeta en Configuración sólo la ve el admin, como Usuarios.
- **`packages/ui`**: `Progress` ahora pasa `value` al root de Radix (antes quedaba sin `aria-valuenow`). `test/setup.ts` del backoffice agrega un stub de `ResizeObserver` (lo usa el `Switch`).

## Tests

| Archivo                                         | Qué cubre                                                                                                                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/contracts.test.ts`                         | Badges por estado, `formatMoney` ARS/USD, `normalizeAmount`, `timelineLabel`, `nextStepLabel`, póliza, PDF                                                                   |
| `lib/dates.test.ts`                             | `formatDate`, `formatPeriod`, `daysBetween`, `addDays`, `todayIso`                                                                                                           |
| `contratos/contract-list.test.tsx`              | Un badge por estado (vigente, por vencer, vencido, rescindido), "Caución vencida", período, montos, links                                                                    |
| `contratos/[id]/contract-detail.test.tsx`       | Línea de tiempo, partes con link, historial, póliza vencida, bloque de rescisión, flujo rescindir (preview → confirmar con `notifiedAt`), aumento manual con error de la API |
| `contratos/contract-form.test.tsx`              | Propiedad obligatoria y sin propietario, los 5 pasos con email de caución, fechas, creación + PDF, borrador, renovación                                                      |
| `configuracion/indices/indices-screen.test.tsx` | Tabla por mes, carga con validación (admin), empleado sin formulario                                                                                                         |

Backoffice: 75 tests (33 nuevos). `npm run typecheck`, `npm run lint` y `npm test` en verde en `apps/backoffice`; `tsc --noEmit` en `packages/shared-types` y `packages/mocks`. **No verificado en un navegador logueado.**

## Pendiente

- Fase 10: paso de servicios del wizard y la sección "Servicios y gastos adelantados" de la ficha. Fase 11: "Estado mes a mes", cobro de la multa, estado de pago en el listado. Fase 13: índices desde la fuente oficial (el formulario manual queda como respaldo) y aumentos automáticos.
- Al recuperar un borrador del wizard, los selectores muestran "Propiedad elegida" / "Inquilino elegido" en vez del nombre (el borrador guarda sólo los ids), igual que en propiedades (Fase 7, pendiente).
- El filtro por propietario (`ownerId`) existe en el hook pero no en la pantalla: se usará desde la ficha del propietario cuando haga falta.
