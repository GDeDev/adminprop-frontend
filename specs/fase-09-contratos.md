# Spec — Fase 9: Contratos

> Resumen simple: acá se arma el contrato de alquiler completo — quién alquila, a quién, en qué condiciones, con qué garante y seguro. Es el módulo más complejo porque conecta todo lo anterior.

**Depende de:** Fase 6 (Propiedades), Fase 7 (Propietarios), Fase 8 (Inquilinos y Garantes) completadas.
**Contiene consultas pendientes a Micaela — marcadas abajo.**
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


Creación de contratos, gestión de póliza de caución, actualización de canon por índice, rescisión anticipada, renovación.

## 2. Entidad

Ver PRD sección 5.5, incluyendo los 6 campos de caución agregados. Campos clave: `propiedad_id`, `propietario_id`, `inquilino_id`, `garante_id` (nullable), `fecha_inicio`, `fecha_fin`, `monto_inicial`, `moneda`, `tipo_actualizacion`, `frecuencia_aumento`, `deposito`, `honorarios_pct`, `estado`, `tiene_caucion`, `aseguradora_nombre`, `aseguradora_email_alerta`, `poliza_numero`, `poliza_vencimiento`, `poliza_pdf`.

## 3. Endpoints

### 3.1 `POST /contracts` (admin, empleado)
```json
{
  "propiedadId": "uuid", "propietarioId": "uuid", "inquilinoId": "uuid",
  "garanteId": "uuid | null",
  "fechaInicio": "date", "fechaFin": "date",
  "montoInicial": "string (decimal)", "moneda": "ARS" | "USD",
  "tipoActualizacion": "ICL" | "IPC" | "Fijo" | "Otro",
  "frecuenciaAumento": "mensual" | "trimestral" | "cuatrimestral",
  "deposito": "string (decimal)",
  "tieneCaucion": "boolean",
  "aseguradoraNombre": "string | null",
  "aseguradoraEmailAlerta": "string | null",
  "polizaNumero": "string | null",
  "polizaVencimiento": "date | null",
  "servicios": [{ "tipoServicioId": "uuid", "quienPaga": "inquilino" | "propietario" }]
}
```
**Response 201.** El `honorarios_pct` se calcula automáticamente al crear (usa el helper de Fase 7, no se recibe del cliente).

**Validaciones:**
- La propiedad no puede tener otro contrato en estado `activo` (RN-04) → 409
- El inquilino no puede ser titular de otro contrato `activo` simultáneo (RN-05) → 409
- Si `tieneCaucion: true`, `aseguradoraEmailAlerta` es obligatorio → 400 si falta
- `fechaFin` posterior a `fechaInicio` → 400 si no

**Efecto colateral:** al crear con éxito, la Propiedad pasa a estado `alquilada` (llama internamente al servicio de Fase 6).

### 3.2 `GET /contracts`
Query: `?estado=activo&propiedadId=uuid&inquilinoId=uuid&porVencer=true&page=1&limit=20`
`porVencer=true` filtra contratos activos con `fecha_fin` dentro de los próximos `tenant.dias_aviso_vencimiento` días (default 60).

### 3.3 `GET /contracts/:id`
Ficha completa + línea de tiempo (calculada, no almacenada: meses transcurridos vs. totales) + estado de cada mes (placeholder hasta Fase 11).

### 3.4 `POST /contracts/:id/upload-pdf` (admin, empleado)
Multipart, sube el contrato escaneado a Cloudinary, guarda URL en `pdf_contrato`.

### 3.5 `POST /contracts/:id/upload-poliza` (admin, empleado)
Multipart, sube la póliza de caución a Cloudinary, guarda URL en `poliza_pdf`.

### 3.6 `POST /contracts/:id/rescindir` (admin, empleado)
```json
{ "fechaNotificacion": "date" }
```
**Response 200:** desglose del cálculo de multa + el contrato actualizado a estado `rescindido`.
```json
{
  "multa": "string (decimal)",
  "saldoCanonFuturo": "string (decimal)",
  "diasRestantes": "number",
  "contrato": { ... }
}
```
Efecto colateral: la Propiedad vuelve a `disponible`.

### 3.7 `POST /contracts/:id/renovar` (admin, empleado)
Crea un nuevo contrato precargado con los datos del anterior (editable antes de confirmar), marca el contrato original como `finalizado` al confirmarse el nuevo.

### 3.8 `POST /contracts/:id/actualizar-canon` (admin, empleado, también invocable por cron de Fase 13)
Aplica el aumento correspondiente según `tipo_actualizacion` y `frecuencia_aumento`. Requiere que exista el índice del período en la tabla de índices (Fase 13). Si no existe el índice todavía, devuelve 422 con mensaje claro.

## 4. Reglas de Negocio

- RN-04, RN-05, RN-09, RN-12, RN-15, RN-16 (ver PRD sección 21) aplican íntegramente en este módulo.
- El `honorarios_pct` se fija en el momento de creación del contrato usando el estado del propietario en ESE momento (no se recalcula automáticamente si el propietario suma/pierde propiedades después — el recálculo dinámico ocurre en el momento de cada Liquidación, Fase 12, no en el Contrato).
- Multa de rescisión (RN-09): `10% × (canon_actual × meses_o_dias_restantes_hasta_fecha_fin)`. El cálculo exacto de "saldo del canon futuro" usa el canon vigente al momento de la notificación (no proyecta aumentos futuros de índice, ya que estos son inciertos).

> ⚠️ **CONSULTA A MICAELA — bloquea el cálculo exacto de `deposito`:**
> ¿El depósito de garantía se actualiza junto con los aumentos del canon (ej. si el canon sube 20%, el depósito también sube 20%) o queda fijo al monto inicial pactado en el contrato? Esto define si `deposito` es un campo estático o si necesita su propio historial de actualización como el canon.
> **Mientras no se responda:** se implementa como campo estático (`deposito` fijo, no se actualiza automáticamente) — es la opción más simple y reversible si la respuesta cambia el comportamiento.

## 5. Frontend (Backoffice) — Vertical Slice

### 5.1 Listado de Contratos
- Filtros por estado, propiedad, inquilino, vencimiento
- Badge visual: verde (activo, vigente), amarillo (vence en <60 días), rojo (vencido sin renovación)

### 5.2 Ficha de Contrato
- Timeline visual (barra de progreso inicio→hoy→fin)
- Datos completos incluyendo sección de caución con badge de vencimiento de póliza
- Estado mes a mes (placeholder gris hasta Fase 11)
- Botones: descargar PDF contrato, descargar póliza, rescindir, renovar

### 5.3 Creación de Contrato (wizard, el más largo del sistema)
- Paso 1: propiedad (solo `disponible`) → auto-completa propietario
- Paso 2: inquilino (buscar o crear inline) → garante (buscar o crear inline)
- Paso 3: condiciones económicas (canon, moneda, índice, frecuencia, depósito)
- Paso 4: caución (toggle sí/no → si sí, campos de aseguradora)
- Paso 5: servicios (heredados de la propiedad, editables)
- Paso 6: fechas + upload de PDF del contrato

### 5.4 Rescisión
- Input de fecha de notificación → preview del cálculo de multa antes de confirmar → confirmación explícita

## 6. Criterios de Aceptación

- [ ] Crear contrato sobre propiedad ya `alquilada` con contrato activo → 409
- [ ] Crear contrato con inquilino que ya es titular de otro contrato activo → 409
- [ ] Crear contrato exitoso cambia el estado de la propiedad a `alquilada`
- [ ] Crear contrato con `tieneCaucion: true` sin `aseguradoraEmailAlerta` → 400
- [ ] El `honorarios_pct` guardado refleja correctamente si el propietario tenía 3+ propiedades activas al momento de crear
- [ ] Rescindir un contrato calcula la multa correctamente (verificar con caso de ejemplo numérico una vez Micaela confirme la fórmula exacta)
- [ ] Rescindir cambia la propiedad de vuelta a `disponible`
- [ ] Renovar un contrato marca el original como `finalizado` y crea uno nuevo `activo`
- [ ] `GET /contracts?porVencer=true` devuelve solo los que vencen dentro del umbral configurado en el tenant

## 7. Casos Borde
- Renovación con cambio de inquilino (no es el mismo que el contrato anterior) → permitido, es un caso válido de "nuevo inquilino en la misma propiedad"
- Contrato en USD sin definir cotización de referencia → **ver consulta de moneda en Fase 11**, este módulo solo almacena `moneda: "USD"` y el monto en esa moneda; la conversión ocurre en el cobro (Fase 11)
- Fecha de notificación de rescisión posterior a la fecha de fin del contrato → 400 (no tiene sentido rescindir un contrato ya vencido)
