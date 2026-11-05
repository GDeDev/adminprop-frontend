# Capturas de las brechas de Micaela

Pantallas nuevas o cambiadas de `integration/frontend-5`, a 375 y 1280 px, en modo claro y oscuro. El nombre es `<pantalla>-<ancho>-<tema>.png`.

| Archivo (prefijo)                    | Qué muestra                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `parametros`                         | Configuración → Parámetros de cobro (punitorio y días de gracia de la inmobiliaria)               |
| `terminos-punitorio-gracia`          | Cambiar términos de cobro: punitorio propio con la referencia de la inmobiliaria y días de gracia |
| `terminos-punitorio-inicio`          | Lo mismo con «Día de inicio del punitorio» (el campo de gracia desaparece)                        |
| `terminos-error-punitorio-requerido` | El 400 `CONTRACT_LATE_FEE_PERCENTAGE_REQUIRED` en el campo del porcentaje                         |
| `ajuste-manual-motivo`               | Aplicar aumento con un monto a mano: motivo y «autorizado por» obligatorios                       |
| `ajuste-manual-historial`            | Historial de aumentos con el motivo y quién autorizó                                              |
| `cuenta-corriente-deposito`          | Cuenta corriente con los movimientos del depósito (importe y moneda, fuera del saldo)             |
| `deposito-devolucion-manual`         | Devolver depósito en modo manual: monto de referencia                                             |
| `deposito-deduccion`                 | Una deducción con motivo obligatorio                                                              |
| `deposito-resultado`                 | Lo que registró la API: referencia, deducciones y lo devuelto                                     |
| `envio-cierre-consolidado`           | Cerrar el consolidado: modo de envío con la explicación                                           |
| `envio-propietario`                  | Honorarios del propietario → Configurar: qué se le envía cada mes                                 |
| `propiedad-coordenadas`              | Formulario de propiedad, paso «Publicación»: latitud y longitud opcionales                        |
| `propiedad-coordenadas-error`        | Validación de rango y de «las dos o ninguna»                                                      |

## Cómo se tomaron

Chromium (Playwright) contra `next dev` del backoffice y una **API falsa descartable** que vive fuera del repo (datos inventados: inmobiliaria «Inmobiliaria Demo», un administrador, un contrato activo y uno rescindido). No hay datos reales. El circulito con una «N» abajo a la izquierda es el indicador de desarrollo de Next, no parte de la pantalla.

## Qué no cubren

- No son capturas contra el backend real: los textos de error del 400 salen del frontend, pero la respuesta de la API es simulada.
- Los diálogos del alta y renovación de contratos (wizard) comparten el mismo bloque de punitorio que «Cambiar términos» y no se capturaron aparte.
- Solo se verificó a 375 y 1280 px; no a 768 px.
