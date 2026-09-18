# Spec — Fase 11: Motor de Cobros y Punitorios

> Resumen simple: es el corazón financiero. Cada mes se generan las cuotas, el inquilino paga, y si se atrasa el sistema calcula automáticamente un interés por cada día de atraso. Es el módulo con más plata en juego, así que tiene el mayor número de preguntas pendientes.

**Depende de:** Fase 9 (Contratos), Fase 10 (Servicios) completadas.
**⚠️ CONTIENE 4 CONSULTAS BLOQUEANTES A MICAELA — no se recomienda implementar el motor de punitorios sin resolverlas primero. El resto del módulo (generación de cuotas, registro de cobro simple) sí puede avanzar.**
**Vertical slice (back + front juntos).**

---

## 1. Alcance

> 🏢 **Multi-Tenant y SaaS:** esta fase construye pensando en múltiples inmobiliarias (tenants) usando el mismo sistema, no solo Oppido. Toda entidad nueva lleva `tenant_id` y usa `TenantScopedRepository` (Fase 1) — ningún query manual sin ese filtro. Ningún nombre, texto o regla específica de Oppido se hardcodea en código; lo que varía por cliente vive en la entidad `Tenant` o en datos.
>
> ✅ **Tests de esta fase deben incluir:** al menos un caso que verifique aislamiento entre tenants (ej. "un usuario del Tenant A no puede ver/modificar datos del Tenant B, ni por ID directo") además de los tests funcionales propios del módulo.
>
> 🧩 **Modularidad (Fase 1, sección 5.1):** este módulo solo se comunica con otros vía su Facade público (`public/`) o mediante eventos del `EventBus` — nunca importando entidades, repositorios o servicios internos de otro módulo directamente.
>
> ☁️ **Infraestructura desacoplada (Fase 1, sección 5.2):** si este módulo usa storage, email, colas o cualquier servicio externo, se accede vía su Port/interfaz (ej. `StoragePort`, `EmailPort`), nunca importando el SDK del proveedor (Cloudinary, Resend, etc.) directamente en el Domain Service — así migrar de Neon/Supabase/Cloudinary/Resend a AWS más adelante es solo un cambio de adapter y configuración.
>
> 🔐 **Secretos y flags (Fase 1, sección 5.3):** las credenciales de esta fase se gestionan en Doppler, nunca hardcodeadas ni en un `.env` compartido. Si esta fase necesita activarse/desactivarse por tenant o probarse gradualmente, usar `FeatureFlagPort` (Flagsmith), no un booleano hardcodeado ni una variable de entorno para eso.
>
> 🌐 **Idioma del código (Fase 1, sección 12):** esta spec nombra entidades y campos en español para que se lea y apruebe fácil — es documentación funcional. El código (clases, variables, columnas, endpoints) se escribe 100% en inglés, traduciendo los nombres al implementar.


Generación de cuotas mensuales, registro de cobros, motor de cálculo de punitorios, estados de pago.

## 2. Entidad

Ver PRD sección 5.6 (Pago). Campos clave: `contrato_id`, `inquilino_id`, `periodo`, `monto_base`, `monto_punitorios`, `monto_total`, `fecha_pago`, `estado`, `comprobante_url`, `metodo_pago`, `registrado_por`.

> ⚠️ **CONSULTA A MICAELA — CA-01, bloquea el schema de esta fase:**
> ¿El sistema debe guardar un registro por cada día de punitorio generado (tabla separada `punitorio_log`, permite auditar día a día cómo se llegó al monto final) o alcanza con persistir solo el total acumulado en `monto_punitorios` al momento del cobro?
> **Impacto:** define si existe o no la tabla `punitorio_log`. Cambiar esto después de tener datos reales cargados es una migración costosa.
> **Mientras no se responda:** se implementa la versión simple (solo total acumulado, sin tabla de log), por ser la opción reversible de menor esfuerzo — si después se pide el detalle diario, se agrega la tabla y se recalcula desde los datos de cron ya ejecutados si están loggeados a nivel de aplicación (logs de sistema, no de negocio).

## 3. Endpoints

### 3.1 `POST /billing/generar-cuotas` (interno — invocado por cron de Fase 13, también ejecutable manual por admin para el mes en curso si el cron falló)
Genera las cuotas del período siguiente para todos los contratos activos del tenant. **Idempotente:** si ya existen cuotas generadas para ese período y contrato, no duplica (skip silencioso + log).

### 3.2 `GET /billing/cobros-del-mes`
Query: `?periodo=2026-06&estado=pendiente|pagado|vencido`
Lista de todas las cuotas del período con su estado actual, para la pantalla de cobros.

### 3.3 `POST /billing/pagos/:pagoId/registrar-cobro` (admin, empleado)
Multipart (comprobante).
```json
{
  "montoRecibido": "string (decimal)",
  "metodoPago": "transferencia" | "efectivo" | "otro",
  "fechaPago": "date"
}
```
**Validación crítica (RN-01):** `montoRecibido` debe ser **exactamente igual** a `monto_total` (base + punitorios acumulados a la fecha de pago). Si es menor → 400 "Pago parcial no permitido, falta cubrir $X". Si es mayor → **ver consulta de saldo a favor abajo.**

### 3.4 `GET /billing/pagos/:pagoId/desglose`
Devuelve el desglose actual: `{ montoBase, diasAtraso, montoPunitorios, montoTotal, fechaLimiteSinPunitorio }` — se recalcula al momento de la consulta (no es un valor cacheado, el punitorio crece día a día hasta que se paga).

## 4. Reglas de Negocio (RN-01, RN-02, RN-03)

- **Período de gracia:** días 1 al `tenant.dias_gracia_pago` (default 10) sin punitorio.
- **A partir del día `dias_gracia_pago + 1`:** se acumula `tenant.punitorio_pct_diario` (default 5%) diario.
- **Sin pagos parciales (RN-01):** el registro de cobro exige el monto total exacto.
- **Bloqueo de base sin punitorio (RN-03):** no puede existir un registro de cobro que cubra solo `monto_base` dejando `monto_punitorios` sin cubrir — al no permitirse pagos parciales, esto queda naturalmente resuelto por RN-01, pero se valida explícitamente igual como doble check.

> ⚠️ **CONSULTA A MICAELA — bloquea la fórmula exacta del cálculo:**
> El PRD dice "5% diario sobre el monto TOTAL del alquiler por cada día de atraso" (RN-02). Confirmar con un ejemplo numérico concreto antes de implementar, porque hay dos lecturas posibles:
> - **Lectura A (interés simple diario sobre base fija):** cada día se suma `5% × monto_base`. Ejemplo: canon $200.000, 5 días de atraso → punitorio = $200.000 × 5% × 5 = $50.000. Total a pagar: $250.000.
> - **Lectura B (interés compuesto o sobre saldo acumulado):** cada día se suma `5% × (monto_base + punitorios_ya_acumulados)`. Esto crece exponencialmente y en pocos días el punitorio supera al canon.
> **Pedir a Micaela un ejemplo real:** "si un inquilino debe $X y se atrasa 5 días, ¿cuánto termina pagando en total?"
> **Mientras no se responda:** se implementa la Lectura A (interés simple sobre base fija), por ser la interpretación más común en la práctica inmobiliaria argentina y evitar un monto que crece de forma descontrolada.

> ⚠️ **CONSULTA A MICAELA — moneda USD:**
> Para contratos en dólares (`moneda: "USD"` en el Contrato), ¿cómo se cobra la cuota mensual? ¿Se paga en USD billete, o se convierte a pesos al momento del cobro? Si se convierte: ¿a qué cotización (oficial, MEP, blue) y de qué fuente se obtiene el valor del día?
> **Mientras no se responda:** el sistema registra el cobro en la misma moneda del contrato (`USD` cobrado en USD), sin conversión automática — el campo `moneda` del Pago hereda el del Contrato. Si la respuesta requiere conversión automática, esto se ajusta como una tarea adicional sin romper el modelo de datos actual (se agregaría `cotizacion_aplicada` y `monto_ars_equivalente` como campos opcionales).

> ⚠️ **CONSULTA A MICAELA — saldo a favor:**
> ¿Se permite que un inquilino pague de más (adelante el mes siguiente, o pague un monto mayor al adeudado por error) y quede un saldo a favor que se descuenta del próximo período? O todo excedente se maneja manualmente fuera del sistema (devolución, ajuste contable aparte)?
> **Mientras no se responda:** el sistema **rechaza** (400) cualquier `montoRecibido` distinto al `monto_total` exacto, tanto de menos (RN-01) como de más — es la opción más segura y reversible; habilitar saldo a favor es agregar funcionalidad, no romper nada existente.

## 5. Frontend (Backoffice) — Vertical Slice

### 5.1 Pantalla de Cobros del Mes
- Listado de todos los inquilinos del período con estado: pendiente (gris), pagado (verde), con mora (rojo, mostrando días de atraso)
- Acción "Registrar cobro" abre bottom sheet: muestra el desglose (base + punitorios si aplica) de forma prominente, input de monto (prellenado con el total exacto, no editable si la regla de "sin parciales" se mantiene estricta), selector de método, upload de comprobante
- Filtros por estado

### 5.2 Indicador visual de mora
- En la ficha de contrato e inquilino, badge con días de atraso y monto de punitorio actual (recalculado en cada carga de pantalla, no estático)

## 6. Criterios de Aceptación

> Nota: varios de estos criterios dependen de las respuestas de Micaela y se ajustan una vez confirmadas.

- [ ] Generar cuotas del mes es idempotente — correrlo dos veces no duplica cuotas
- [ ] Un pago registrado dentro del período de gracia (días 1-10) no genera punitorio
- [ ] Un pago registrado el día 11 en adelante calcula punitorio según la fórmula confirmada por Micaela
- [ ] Intentar registrar un cobro por un monto menor al total exacto → 400
- [ ] Intentar registrar un cobro por un monto mayor al total exacto → comportamiento según respuesta de saldo a favor (default: 400)
- [ ] El desglose (`GET .../desglose`) recalcula correctamente el punitorio según la fecha actual, sin necesidad de que un cron haya corrido ese día exacto
- [ ] Registrar un cobro correcto cambia el estado del Pago a `pagado` y dispara (evento, no bloqueante) la generación de liquidación (Fase 12)

## 7. Casos Borde
- Pago registrado el mismo día 11 (límite exacto del período de gracia) — definir si el día 10 es el último sin punitorio o el 11 ya lo tiene (el PRD dice "a partir del día 11" → día 10 último sin punitorio, día 11 ya acumula)
- Contrato que empieza a mitad de mes — la primera cuota, ¿es proporcional o mes completo? (no está definido en el PRD — **agregar como consulta adicional si surge en la práctica**, no bloqueante para el MVP si Oppido no tiene casos así actualmente)
- Cron de generación de cuotas cae en fin de semana/feriado — debe ejecutar igual (es un job automático, no depende de días hábiles)
