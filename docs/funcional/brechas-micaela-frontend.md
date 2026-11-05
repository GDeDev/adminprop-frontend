# Qué cambia en el backoffice (brechas de Micaela)

Resumen para quien usa el sistema. Cada punto responde a un pedido de Micaela que el backend ya cumple.

## Punitorio

- **Configuración → Parámetros de cobro** (solo administradores): el punitorio diario por defecto de la inmobiliaria y los días de gracia. Ya no hay un 5 % automático. Una vez cargado, el porcentaje no se puede borrar; para no cobrar punitorio se pone 0. Cambiarlo afecta solo a las cuotas que se generen de ahí en adelante.
- **Contratos (alta, renovación y cambio de términos de cobro)**: si el contrato tiene punitorio propio, se indica el porcentaje diario y **desde cuándo corre**, a elección:
  - **Días de gracia**: por ejemplo 10, y el punitorio corre desde el día 11; o
  - **Día de inicio del punitorio**: por ejemplo el día 16 del mes.

  Son la misma idea dicha al revés, así que se elige una sola. Al lado del campo aparece, para los administradores, el valor de la inmobiliaria como referencia. Si la inmobiliaria no definió un punitorio, el contrato tiene que indicar el suyo; si se intenta guardar sin él, el sistema lo avisa en el campo.

## Depósito de garantía

Al terminar el contrato, **Devolver depósito** parte de un **monto de referencia** que depende del modo del contrato:

- **Se devuelve lo recibido** (fijo): el depósito tal como se recibió.
- **Se devuelve el alquiler vigente** (sigue al alquiler): el alquiler del último mes. Si el alquiler está en otra moneda que el depósito, no se convierte y hay que indicar el monto.
- **Monto a definir al devolver** (manual): se escribe el monto de referencia.

Las **deducciones** (deuda, daños u otro) necesitan siempre un **motivo** y se descuentan de esa referencia. El sistema calcula lo que se devuelve y lo muestra al terminar: el monto de referencia, cada deducción y lo devuelto al inquilino. Si las deducciones superan la referencia, el sistema no deja registrar. En la cuenta corriente, los movimientos del depósito muestran su importe y moneda, aparte del saldo (el depósito no cambia lo que debe el inquilino).

## Ajuste manual del alquiler

Al aplicar un aumento con un monto escrito a mano, hay que completar el **motivo** y **quién lo autorizó** (por ejemplo, el propietario). Los dos quedan en el historial de aumentos del contrato. Los aumentos por índice o por porcentaje fijo no los piden.

## Qué se envía al propietario

En la ficha del propietario (Honorarios → Configurar) y al cerrar un consolidado se elige:

- **Solo el resumen**: un email por mes con el consolidado; no se mandan los comprobantes de cada liquidación al confirmarla.
- **Comprobantes individuales**: el comprobante de cada liquidación al confirmarla; no se manda el email del consolidado.
- **Ambos**: los dos.

Los comprobantes que ya salieron al confirmar una liquidación no se pueden retirar: si se quiere garantizar «solo el resumen», hay que dejar al propietario en esa opción antes de confirmar. Los PDF se generan igual y quedan en el portal del propietario.

## Ubicación de la propiedad

El formulario de propiedades (paso «Publicación») admite **latitud y longitud** opcionales, con coma o punto y hasta 6 decimales (latitud entre −90 y 90, longitud entre −180 y 180). Se cargan las dos o ninguna. El sitio público muestra el mapa con la ubicación redondeada a unos 100 m: se ve la zona, no la puerta.

## Pendientes de decisión de negocio (del backend)

- El punitorio «desde cuándo» se interpretó como día del mes, no como una fecha absoluta (D-228).
- Un ajuste manual lo pueden hacer administradores y empleados; falta definir si un empleado puede (D-230).
- Los comprobantes ya enviados no se retiran al elegir «solo el resumen» después (D-229).
