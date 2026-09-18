# Spec — Fase 12: Liquidaciones

> Resumen simple: una vez que el inquilino paga, se calcula cuánto le queda al propietario después de descontar la comisión de la inmobiliaria y los gastos que el inquilino adelantó.

**Depende de:** Fase 11 (Motor de Cobros) completada.
**⚠️ CONTIENE 2 CONSULTAS BLOQUEANTES A MICAELA.**
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


Generación automática de liquidación al confirmarse un cobro, cálculo de honorarios (con regla de reducción), descuento de gastos adelantados, gestión de estados y comprobante de transferencia al propietario.

## 2. Entidad

Ver PRD sección 5.7. Campos: `propietario_id`, `propiedad_id`, `periodo`, `monto_alquiler`, `honorarios_monto`, `honorarios_pct`, `gastos_adelantados`, `monto_a_transferir`, `estado`, `fecha_liquidacion`, `pdf_liquidacion`.

> ⚠️ **CONSULTA A MICAELA — CA-02, bloquea el flujo completo de esta fase:**
> El modelo actual genera una liquidación **por propiedad**. ¿Se necesita además una liquidación **consolidada por propietario** que agrupe todas sus propiedades del mes en un único resumen/PDF?
> Si la respuesta es sí, definir:
> - ¿Se genera automáticamente cuando todas las propiedades del propietario ese mes están pagadas, o el empleado la genera manualmente cuando decide cerrar el mes?
> - ¿El email al propietario incluye ambos PDFs (cada liquidación individual + la consolidada) o solo la consolidada con el detalle de cada propiedad adentro?
> **Impacto:** afecta el schema (necesitaría un campo `liquidacion_consolidada_id` o tabla separada), el flujo de Fase 13-14 (cuándo se dispara el email) y la plantilla de PDF (Fase 15).
> **Mientras no se responda:** se implementa **solo la liquidación individual por propiedad** (lo que ya está en el schema del PRD), sin consolidada. Es la opción base y no bloquea el uso real del sistema — la consolidada se puede sumar después como una fase adicional sin romper lo existente, ya que sería una capa de agregación sobre liquidaciones que ya existen.

## 3. Endpoints

### 3.1 `POST /settlements/generar` (interno — disparado automáticamente al confirmarse un cobro en Fase 11, vía evento de dominio, no llamado directo por el usuario en el flujo normal)
Calcula y crea la liquidación para la propiedad/período correspondiente al pago recién confirmado.

### 3.2 `GET /settlements`
Query: `?propietarioId=uuid&periodo=2026-06&estado=pendiente|transferida|confirmada&page=1&limit=20`

### 3.3 `GET /settlements/:id`
Detalle completo con desglose del cálculo.

### 3.4 `PATCH /settlements/:id/marcar-transferida` (admin, empleado)
Multipart (comprobante de transferencia al propietario).
```json
{ "fechaTransferencia": "date" }
```

### 3.5 `GET /settlements/owner/:ownerId/historial`
Historial completo de liquidaciones de un propietario (para su ficha y su portal, Fase 17).

## 4. Reglas de Negocio (RN-06, RN-07, RN-08, RN-11)

**Fórmula:** `monto_a_transferir = monto_alquiler − honorarios_monto − gastos_adelantados`

- **Honorarios (RN-06, RN-07, RN-08):** el porcentaje se evalúa **en el momento exacto de generar cada liquidación**, usando el helper centralizado de Fase 7 (`COUNT(propiedades activas del propietario) >= tenant.umbral_honorario_reducido → 3% : 5%`). Esto es intencionalmente distinto al `honorarios_pct` guardado en el Contrato (que se fija una sola vez al crear el contrato) — la Liquidación siempre recalcula con el estado actual del propietario, que puede haber cambiado desde que el contrato se firmó.
- **Gastos adelantados (RN-11):** todos los gastos de ese contrato con `descontado_en_liquidacion_id IS NULL` y `fecha` dentro del período se incluyen automáticamente y se marcan como descontados al confirmarse la liquidación.
- Una Liquidación en estado `pendiente` puede recalcularse si se agrega un gasto adelantado antes de transferir; una vez `transferida`, es inmutable.

> ⚠️ **CONSULTA A MICAELA — bloquea la base del cálculo de honorarios:**
> ¿El honorario (5% o 3%) se calcula sobre el **canon base** cobrado, o sobre **canon + punitorios** cuando el inquilino pagó con atraso? Es decir, si el inquilino pagó $250.000 (canon $200.000 + $50.000 de punitorio), ¿la comisión de la inmobiliaria es sobre los $200.000 o sobre los $250.000?
> **Mientras no se responda:** se calcula sobre el **canon base únicamente** (`monto_alquiler`, sin incluir punitorios) — es la interpretación estándar del mercado (el punitorio es una penalidad al inquilino, no ingreso "de alquiler" per se) y la opción más simple de ajustar si la respuesta indica lo contrario.

## 5. Frontend (Backoffice) — Vertical Slice

### 5.1 Listado de Liquidaciones
- Filtro por propietario, período, estado
- Badge de estado con color

### 5.2 Detalle de Liquidación
- Desglose completo y legible: canon cobrado − honorarios (%) − gastos adelantados (lista) = neto a transferir
- Botón "Marcar como transferida" con upload de comprobante
- Botón descargar PDF (placeholder de generación real hasta Fase 15, pero el botón y el flujo de UI existen)

### 5.3 Historial en Ficha de Propietario
- Lista cronológica con acceso rápido a cada detalle

## 6. Criterios de Aceptación

- [ ] Confirmar un cobro dispara automáticamente la creación de la liquidación correspondiente
- [ ] El honorario aplicado refleja correctamente 3% o 5% según la cantidad de propiedades activas del propietario **al momento de la liquidación**, no al momento del contrato
- [ ] Los gastos adelantados pendientes del contrato/período se incluyen y se marcan como descontados
- [ ] Una liquidación `transferida` no puede modificarse (intento de recálculo → 409)
- [ ] El monto a transferir calculado es matemáticamente exacto (verificar con `decimal.js`, sin errores de redondeo)

## 7. Casos Borde
- Propietario con 3 propiedades activas al momento del contrato pero solo 2 al momento de liquidar (vendió/rescindió una) → se liquida al 5% (ya no cumple el umbral), reflejando el estado actual, no el histórico
- Gasto adelantado cargado después de que la liquidación del período ya se generó (pero antes de transferirse) → debe poder recalcularse o incluirse en la siguiente liquidación (a definir en implementación: preferible incluir automáticamente si la liquidación sigue `pendiente`)
- Liquidación de un contrato que se rescinde a mitad de período — considerar los gastos adelantados pendientes de ese contrato en el cierre final (ver nota dejada en Fase 10)
