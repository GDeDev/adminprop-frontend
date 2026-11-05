# Reglas de plata en el frontend (`integration/frontend-6`)

Cubre del lado del backoffice lo que el backend resolvió en `integration/consolidado-4` (D-234 a D-238 y D-240 a D-245; ver `adminprop-backend/docs/INTEGRACION_CONSOLIDADO_4.md`). Decisiones propias: DT-167 a DT-173 en `docs/DECISIONES_TECNICAS.md`.

Regla común: el frontend no calcula dinero. Todo monto viaja como string y se muestra con `formatMoney` (`@adminprop/ui/lib/format`). `creditsApplied` es una cantidad, no un monto.

## Tipos

`packages/shared-types/src/generated/api.ts` se regeneró contra el `openapi.json` de `integration/consolidado-4` (comando de `shared-types-generados.md`, apuntando `openapi-typescript` a una copia del JSON, porque el script `api:types` usa una ruta relativa que no existe fuera del checkout normal). Esta vez no hizo falta parchear el OpenAPI (el `$ref` roto de `ImportEntityCountsDto` ya está arreglado en el backend). Lo que rompió fueron solo tres fixtures de tests (los tres campos nuevos de la liquidación son requeridos).

## Qué hay y dónde

| Tema                             | Backend    | Frontend                                                                                                                                                                                                        | Decisión |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Ajuste manual solo admin         | D-235      | `contratos/[id]/rent-update-dialog.tsx`                                                                                                                                                                         | DT-167   |
| Reporte de ingresos por receptor | D-234      | `reportes/income-by-receiver.tsx`, `reportes/reports-screen.tsx`                                                                                                                                                | DT-168   |
| Retenciones, adelantos, otros    | D-236      | `liquidaciones/adjustment-breakdown-cell.tsx`, `liquidaciones/settlements-screen.tsx`, `liquidaciones/[id]/settlement-detail.tsx`, `liquidaciones/consolidados/[id]/statement-detail.tsx`, `lib/settlements.ts` | DT-169   |
| Por liquidar                     | D-237      | `contratos/[id]/account-section.tsx`                                                                                                                                                                            | DT-170   |
| Saldo a favor automático         | D-238      | `configuracion/parametros/billing-parameters-screen.tsx`, `lib/billing.ts` (`generationMessage`), `cobros/billing-screen.tsx`                                                                                   | DT-171   |
| Idempotency-Key en pagos         | D-243      | `cobros/[id]/register-payment-dialog.tsx`, `lib/billing-api.ts`                                                                                                                                                 | DT-172   |
| Mensajes de errores nuevos       | D-240, 241 | `packages/session/src/client/api-error.ts`                                                                                                                                                                      | DT-173   |

## CORS de `Idempotency-Key` (resuelto en el backend)

El preflight por `Idempotency-Key` exige que esté en `allowedHeaders` de CORS. Eso ya está arreglado en la rama `integration/consolidado-5` del backend; con una rama anterior, registrar un pago falla con error de red. Ver DT-172.

## Tests nuevos o ajustados

- `contract-detail.test.tsx`: empleado sin campo manual, empleado con índice, 403.
- `reportes/income-by-receiver.test.tsx`.
- `lib/settlements.test.ts`, `settlement-detail.test.tsx`, `settlements-screen.test.tsx`, `consolidados/[id]/statement-detail.test.tsx` (nuevo; incluye el diálogo de cierre).
- `account-section.test.tsx` («Por liquidar» con su descripción accesible).
- `lib/billing.test.ts` (`generationMessage`), `billing-parameters-screen.test.tsx` (interruptor).
- `lib/billing-api.test.tsx` (header `Idempotency-Key`), `installment-detail.test.tsx` (misma clave en el reintento, otra al reabrir, 409).
- `packages/session/src/client/api-error.test.ts`.

## Capturas

`docs/design/capturas-reglas-plata/` (375 y 1280 px, claro y oscuro). Ver el `README.md` de esa carpeta.
