# Brechas de Micaela en el frontend (`integration/frontend-5`)

Cubre del lado del backoffice lo que el backend resolvió en `integration/consolidado-3` (decisiones D-226 a D-230, ver `adminprop-backend/docs/DECISIONES_TECNICAS.md` y `docs/INTEGRACION_CONSOLIDADO_3.md`). Las decisiones propias son DT-160 a DT-165 en `docs/DECISIONES_TECNICAS.md`. Los tipos vienen del OpenAPI regenerado (`docs/tecnica/shared-types-generados.md`); no se escribió ningún DTO a mano.

Regla común: el frontend no calcula dinero. Todo monto viaja y vuelve como string y se muestra con `formatMoney` (`@adminprop/ui/lib/format`).

## Qué hay y dónde

| Tema                   | Backend | Frontend                                                                                                                                               | Decisión |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Parámetros de cobro    | D-228   | `configuracion/parametros/billing-parameters-screen.tsx`, `lib/billing-settings.ts` (commit previo a esta rama)                                        | DT-160   |
| Punitorio del contrato | D-228   | `contratos/[id]/change-billing-terms-dialog.tsx` (`LateFeeFields`), `contratos/contract-form.tsx` (alta y renovación), `lib/late-fee.ts`               | DT-161   |
| Depósito               | D-227   | `contratos/[id]/deposit-return-dialog.tsx`, `contratos/[id]/account-section.tsx`                                                                       | DT-162   |
| Ajuste manual          | D-230   | `contratos/[id]/rent-update-dialog.tsx`, historial en `contratos/[id]/contract-detail.tsx`                                                             | DT-163   |
| Modo de envío          | D-229   | `components/send-mode-select.tsx`, usado en `propietarios/[id]/owner-fee-settings-dialog.tsx` y `liquidaciones/consolidados/[id]/statement-detail.tsx` | DT-164   |
| Coordenadas            | D-226   | `propiedades/property-form.tsx`, `lib/properties.ts` (`parseCoordinate`)                                                                               | DT-165   |

## Punitorio del contrato

- `lateFeeRequestFields(values)` arma el cuerpo: sin punitorio propio, `lateFeePercentage: null` y `lateFeeGraceDays: null`; con uno propio, el porcentaje más **una** de `lateFeeGraceDays` o `lateFeeStartDay` (la otra clave ni se envía).
- `validateLateFee(values)` es la validación común (esquema zod del diálogo y del wizard): porcentaje 0 a 100, gracia 0 a 31, día de inicio 1 a 31.
- `useTenantLateFeeReference()` (`lib/tenant-settings-api.ts`) lee `GET /tenants/current/settings` solo si el rol es ADMIN. Devuelve `percentage` `undefined` (no se sabe), `null` (la inmobiliaria no fijó uno) o el string. Con `null`, el interruptor «Punitorio propio» queda activado y bloqueado.
- Errores: `CONTRACT_LATE_FEE_PERCENTAGE_REQUIRED` marca el campo del porcentaje (y abre el interruptor); `CONTRACT_INVALID_BILLING_TERMS` con campo `lateFee…` muestra «Elegí días de gracia o día de inicio…». En el wizard, `applyApiErrors` devuelve al paso de condiciones.
- Los borradores del wizard anteriores no tienen `lateFeeTiming` ni `lateFeeStartDay`: `readDraft` los completa desde `EMPTY`.

## Depósito de garantía

- El diálogo no manda `returnedAmount`. Manda `returnedAt`, `method`, `notes`, `deductions[]` y, solo en modo manual o con `suggestedReturn === null`, `referenceAmount`.
- `suggestedReturn` (de `GET /contracts/:id/account`) es la referencia que se muestra antes de enviar. No hay endpoint de previsualización; el resultado final (`DepositReturn`) se muestra en el mismo diálogo después de registrar (`DepositReturnSummary`).
- `depositReturnErrorMessage` traduce `DEPOSIT_RETURN_DEDUCTIONS_EXCEED`, `DEPOSIT_RETURN_INVALID_REFERENCE`, `DEPOSIT_RETURN_UNBALANCED` y `DEPOSIT_RETURN_CONTRACT_ACTIVE`.
- Cuenta corriente: si un movimiento trae `amount`, se muestra «Importe: … (no modifica el saldo)» con `amountCurrency` (cae en la moneda del contrato si falta). Debe/Haber/Saldo no cambian.

## Ajuste manual

`confirm()` exige `reason` y `authorizedBy` cuando hay un monto escrito (`manual = requiresAmount || newRent !== ""`) y los manda recortados. El historial (`rentUpdates[]`) muestra `adjustmentReason` y `authorizedBy` en la lista de mobile y en la tabla de escritorio.

## Modo de envío

`SendModeSelect` recibe `context: "owner" | "close"`; el texto de ayuda (`SEND_MODE_HELP`) cambia por modo y por contexto. La ayuda está enlazada con `aria-describedby`. Etiquetas en `lib/settlements.ts` (`SEND_MODE_LABELS`).

## Coordenadas

`parseCoordinate(input, "latitude" | "longitude")`: `-?\d{1,3}([.,]\d{1,6})?` y rango. En el formulario van al final del paso «Publicación». Un `superRefine` pide las dos o ninguna. Al editar, vaciar manda `null`.

## Tests nuevos o ajustados

- `lib/late-fee.test.ts`, `change-billing-terms-dialog.test.tsx` (referencia, día de inicio, obligatorio sin referencia, 400), `contract-form.test.tsx` (mock de la referencia).
- `deposit-return-dialog.test.tsx`, `account-section.test.tsx`.
- `contract-detail.test.tsx` (motivo y autorizante, historial).
- `components/send-mode-select.test.tsx`.
- `property-form.test.tsx`, `lib/properties.test.ts` (coordenadas).

## Capturas

`docs/design/capturas-brechas/` (375 y 1280 px, claro y oscuro), tomadas con Chromium (Playwright) contra una API falsa descartable que vive fuera del repo. Ver el `README.md` de esa carpeta.
