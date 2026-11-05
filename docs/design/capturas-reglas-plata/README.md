# Capturas de las reglas de plata

Pantallas nuevas o cambiadas de `integration/frontend-6`, a 375 y 1280 px, en modo claro y oscuro. El nombre es `<pantalla>-<ancho>-<tema>.png`.

| Archivo (prefijo)          | Qué muestra                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `ajuste-manual-empleado`   | Aplicar aumento como empleado: campo manual deshabilitado, «Lo hace un administrador» |
| `reporte-ingresos`         | Reportes → Ingresos: totales por moneda y quién cobró (inmobiliaria / propietario)    |
| `liquidaciones-lista`      | Liquidaciones: columna «Ajustes» con retenciones, adelantos y otros por separado      |
| `liquidacion-detalle`      | Detalle: «Ajustes (total)» y sus tres componentes                                     |
| `consolidado-detalle`      | Consolidado: bloque de ajustes por moneda y columna en la tabla                       |
| `consolidado-cierre`       | Cierre del consolidado: «Lo que se congela» con el desglose                           |
| `cuenta-por-liquidar`      | Cuenta corriente del contrato con «Por liquidar» y su explicación                     |
| `parametros-saldo-favor`   | Parámetros de cobro con el interruptor del saldo a favor (apagado)                    |
| `generar-cuotas-resultado` | Aviso al generar cuotas con «Se aplicaron 2 saldos a favor»                           |
| `pago-idempotencia-409`    | Registrar pago con el 409 `IDEMPOTENCY_KEY_REUSED` explicado                          |

## Cómo se tomaron

Chromium (Playwright) contra `next dev` del backoffice (con `devIndicators: false` solo para la captura, sin commitear) y una **API falsa descartable** que vive fuera del repo, con datos inventados. No hay datos reales.

## Qué no cubren

- No son capturas contra el backend real: los números y los errores (incluido el 409) los inventa la API falsa. En particular, la API falsa **sí permite** el header `Idempotency-Key` en CORS; el backend real todavía no (ver DT-172).
- El interruptor aparece apagado; el estado encendido no se capturó.
- Solo se verificó a 375 y 1280 px; no a 768 px. El portal del propietario no cambió.
