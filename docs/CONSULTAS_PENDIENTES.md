# Consultas para Micaela — Adminprop

> Estas son todas las preguntas que quedaron pendientes al escribir las especificaciones técnicas de cada módulo. Ninguna bloquea el arranque del desarrollo — el equipo puede empezar a codear ya — pero sí hay que resolverlas antes de llegar a los módulos de Contratos, Cobros y Liquidaciones, que son los que manejan la plata. Cuanto antes las respondas, más fluido avanza el desarrollo.

---

## 🔴 Prioridad Alta — bloquean el motor financiero (Contratos, Cobros, Liquidaciones)

### 1. Punitorios — ¿cómo se calcula exactamente?
El sistema dice "5% diario sobre el monto total del alquiler por cada día de atraso". Necesitamos un ejemplo numérico real para no interpretarlo mal, porque hay dos formas posibles de calcularlo y dan resultados muy distintos:

- **Opción A:** cada día de atraso se suma 5% del canon original. Ejemplo: alquiler $200.000, 5 días de atraso → $200.000 × 5% × 5 días = $50.000 de punitorio. Total a pagar: $250.000.
- **Opción B:** el 5% se calcula sobre el monto que ya incluye los punitorios de los días anteriores (crece más rápido, puede superar el valor del alquiler en pocos días).

**Pregunta concreta:** *si un inquilino debe $200.000 y se atrasa 5 días, ¿cuánto termina pagando en total?*

---

### 2. Punitorios — ¿guardamos el detalle día por día o solo el total?
Cuando un inquilino paga con atraso, el sistema puede guardar:
- Solo el monto final de punitorio en el momento del pago (más simple), o
- Un registro de cada día de atraso por separado, para poder mostrar/auditar exactamente cómo se llegó a ese número (más completo, pero requiere más desarrollo).

**Pregunta concreta:** *¿necesitás poder ver el detalle día por día de cómo se acumuló un punitorio, o alcanza con ver el total final?*

---

### 3. Honorarios de la inmobiliaria — ¿sobre qué monto se calculan?
Cuando un inquilino paga con atraso (canon + punitorio), la comisión de la inmobiliaria (5% o 3%):
- ¿Se calcula solo sobre el alquiler ($200.000 del ejemplo), o
- Se calcula sobre el total cobrado incluyendo el punitorio ($250.000 del ejemplo)?

**Pregunta concreta:** *si el inquilino paga con atraso y termina abonando $250.000 (alquiler + punitorio), la comisión de la inmobiliaria, ¿es sobre los $200.000 o sobre los $250.000?*

---

### 4. Liquidación consolidada — ¿existe?
Hoy el sistema genera una liquidación (comprobante de lo que le corresponde) **por cada propiedad**. Si un propietario tiene 4 propiedades, recibiría 4 comprobantes separados.

**Preguntas concretas:**
- *¿Necesitás además un resumen único por propietario que junte todas sus propiedades del mes en un solo documento?*
- Si la respuesta es sí: *¿ese resumen se genera automáticamente apenas están todas sus propiedades pagadas, o preferís generarlo vos manualmente cuando decidís cerrar el mes?*
- *¿El propietario debe recibir por mail el resumen consolidado solamente, o también cada comprobante individual de cada propiedad?*

---

### 5. Depósito de garantía — ¿se actualiza?
Cuando el alquiler aumenta (por índice ICL/IPC), el depósito en garantía que dejó el inquilino al firmar el contrato:
- ¿Queda fijo al monto original de cuando se firmó el contrato, o
- Se actualiza en la misma proporción que el alquiler?

**Pregunta concreta:** *si el depósito inicial fue de $200.000 y el alquiler después subió un 30%, ¿el depósito sigue siendo $200.000 o pasa a ser $260.000?*

---

### 6. Contratos en dólares — ¿cómo se cobran?
Para los contratos pactados en USD:

**Preguntas concretas:**
- *¿El inquilino paga en dólares billete, o paga en pesos al tipo de cambio del día?*
- Si es en pesos: *¿a qué cotización te referís (oficial, MEP, blue) y de dónde sacás ese valor habitualmente?*

---

### 7. Pagos de más / saldo a favor
**Pregunta concreta:** *¿alguna vez un inquilino paga de más (por error, o para adelantar el mes siguiente) y ese excedente queda como saldo a favor para el próximo período? ¿O eso siempre se resuelve por fuera del sistema (devolución, ajuste manual)?*

---

## 🟡 Prioridad Media — no frenan el arranque, pero conviene resolver pronto

### 8. Fuente del índice ICL/IPC
El sistema necesita actualizar automáticamente los índices de aumento todos los días.

**Pregunta concreta:** *hoy, cuando calculás un aumento por ICL o IPC, ¿de dónde sacás el valor del índice? ¿Es de un sitio web puntual, o conocés si el Banco Central (BCRA) publica una fuente oficial más estable que podamos usar directamente?*

---

## 🟢 Prioridad Baja — para cuando se pueda, no urgen

### 10. Identidad de marca
**Pregunta concreta:** *¿nos podés pasar el logo oficial de Oppido Propiedades y, si tenés definidos, los colores de marca exactos?* (Ya tenemos una propuesta de paleta armada, pero si tienen una identidad oficial preferimos usar esa).

### 11. Acceso al dominio
**Pregunta concreta:** *¿dónde está registrado el dominio de Oppido Propiedades (GoDaddy, Nic.ar, otro)? Necesitamos acceso para configurar el envío de emails del sistema.*

### 12. API Key de Tokko
**Pregunta concreta:** *¿nos podés pasar la clave de acceso (API Key) de la cuenta de Tokko de Oppido?* La necesitamos para traer automáticamente toda la cartera de propiedades actual y no tener que cargarla a mano.

### 13. Datos reales para probar
**Pregunta concreta:** *para las primeras pruebas del sistema, ¿nos podés indicar 3 o 4 propiedades reales (con su contrato vigente) para cargar como ejemplo? Así probamos con datos reales en vez de inventados.*

---

*Documento generado a partir de las especificaciones técnicas de cada módulo. Cada consulta indica en qué parte del sistema impacta — si preferís, podemos agendar 20-30 minutos para repasarlas juntos en vez de responder por escrito.*
