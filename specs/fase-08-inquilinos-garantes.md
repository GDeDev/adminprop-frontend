# Spec — Fase 8: Inquilinos y Garantes

> Resumen simple: acá se cargan los inquilinos (quienes alquilan) y sus garantes. Es parecido a Propietarios pero más simple, sin datos bancarios propios.

**Depende de:** Fase 5 (Maestros) completada.
**Se ejecuta en paralelo con Fases 6 y 7 (las tres dependen solo de Fase 5).**
**No depende de respuestas de Micaela.**
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


CRUD de Inquilinos, CRUD de Garantes, vinculación entre ambas entidades, generación de credenciales de portal.

## 2. Entidades

### 2.1 Inquilino
Ver PRD sección 5.3. Campos: `nombre`, `apellido`, `dni` (único por tenant), `telefono`, `email`, `direccion`, `fecha_ingreso`, `garante_id` (FK nullable), `portal_usuario`, `portal_password_hash`.

### 2.2 Garante
Ver PRD sección 5.4. Campos: `nombre`, `apellido`, `dni`, `telefono`, `email`, `direccion`, `tipo_garantia` (enum: `propiedad` \| `recibos_sueldo`), `detalle_garantia` (texto: dirección del bien o datos del empleador/monto según tipo).

## 3. Endpoints

### 3.1 Inquilinos

**`POST /tenants-renters`** (nota: usar nombre de recurso que no choque con "tenant" multi-tenant del sistema — sugerido `/inquilinos` o `/renters` en inglés interno, definir convención única y mantenerla) (admin, empleado)
```json
{
  "nombre": "string", "apellido": "string", "dni": "string",
  "telefono": "string", "email": "string", "direccion": "string",
  "fechaIngreso": "date", "garanteId": "uuid | null"
}
```
**Response 201.** DNI único por tenant → 409 si duplicado.

**`GET /renters`** — Query: `?search=string&estadoPago=al_dia|moroso&propiedadId=uuid&page=1&limit=20`
> `estadoPago` es un campo derivado que recién tiene sentido real desde Fase 11 (Motor de Cobros) — en esta fase el filtro existe en la API pero siempre devuelve "sin datos" hasta que Fase 11 esté implementada. No bloquea esta fase.

**`GET /renters/:id`** — Ficha completa + garante expandido + contrato activo (placeholder hasta Fase 9) + historial de pagos (placeholder hasta Fase 11).

**`PATCH /renters/:id`** (admin, empleado)

**`POST /renters/:id/portal-credentials`** (admin, empleado) — mismo patrón que Fase 7.

**`DELETE /renters/:id`** (admin) — soft delete, bloqueado (409) si tiene contrato activo.

### 3.2 Garantes

**`POST /guarantors`** (admin, empleado)
```json
{
  "nombre": "string", "apellido": "string", "dni": "string",
  "telefono": "string", "email": "string", "direccion": "string",
  "tipoGarantia": "propiedad" | "recibos_sueldo",
  "detalleGarantia": "string"
}
```

**`GET /guarantors`** — Query: `?search=string`

**`GET /guarantors/:id`** — Incluye lista de inquilinos/contratos que garantiza.

**`PATCH /guarantors/:id`**

**`DELETE /guarantors/:id`** — bloqueado (409) si está vinculado a un contrato activo.

## 4. Reglas de Negocio

- DNI de Inquilino único por tenant (mismo criterio que Propietario).
- Un Garante **puede estar vinculado a múltiples contratos** (una persona puede garantizar más de un alquiler) — no hay restricción de unicidad de vínculo.
- Un Inquilino tiene **un único garante activo a la vez** vía `garante_id` en la entidad Inquilino — si en el futuro se necesita más de un garante por inquilino, requiere tabla intermedia (no en el MVP, un solo garante alcanza según PRD).
- `detalle_garantia` es de tipo texto libre en el MVP (no estructurado). Si `tipo_garantia = recibos_sueldo`, se espera que el texto incluya empleador y monto aproximado; si es `propiedad`, dirección y datos registrales — validación es solo de "campo no vacío", no de formato estructurado.

## 5. Frontend (Backoffice) — Vertical Slice

### 5.1 Listado de Inquilinos
- Tarjetas: nombre, propiedad asociada (cuando exista Fase 9), badge de estado de pago (placeholder gris hasta Fase 11)
- Filtros: propiedad, estado de pago (deshabilitado visualmente hasta que tenga datos reales)

### 5.2 Ficha de Inquilino
- Datos personales, datos del garante (expandido, con link a ficha de garante)
- Placeholder "Contrato activo" (Fase 9) y "Historial de pagos" (Fase 11)
- Botón WhatsApp (deep link `wa.me/<telefono>`)

### 5.3 Alta/Edición de Inquilino
- Formulario de datos personales
- Sección de garante: buscar existente (autocomplete) o crear nuevo inline (modal/bottom sheet)

### 5.4 Gestión de Garantes (pantalla propia)
- Listado simple, alta/edición, tipo de garantía con campo condicional según selección

## 6. Criterios de Aceptación

- [ ] Crear inquilino con DNI duplicado en el mismo tenant → 409
- [ ] Crear inquilino con garante inexistente (`garanteId` inválido) → 400
- [ ] Un garante puede asociarse a dos inquilinos distintos sin error
- [ ] Eliminar un garante vinculado a un contrato activo → 409 (una vez exista Fase 9; hasta entonces, verificar solo que no rompa si no hay contratos todavía)
- [ ] El botón WhatsApp abre `wa.me` con el número formateado correctamente (sin espacios, con código de país)
- [ ] Crear garante con `tipoGarantia: "propiedad"` y `detalleGarantia` vacío → 400

## 7. Casos Borde
- Inquilino sin garante (`garante_id: null`) → permitido, el PRD no exige garante obligatorio en todos los casos
- Buscar garante por DNI en el autocomplete y no encontrarlo → ofrecer "crear nuevo" inline sin salir del formulario de inquilino
- Cambiar el garante de un inquilino con contrato activo → permitido pero debe quedar registrado en auditoría (cambio de garante en contrato vigente es sensible)
