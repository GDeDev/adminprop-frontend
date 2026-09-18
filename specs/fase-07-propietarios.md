# Spec — Fase 7: Propietarios

> Resumen simple: acá se cargan los dueños de las propiedades, con sus datos bancarios (para poder pagarles después) y el sistema calcula solo si les toca el descuento de comisión por tener varias propiedades.

**Depende de:** Fase 5 (Maestros) completada.
**Se ejecuta en paralelo con Fase 6 (ambas dependen solo de Fase 5).**
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


CRUD completo de Propietarios, gestión de datos bancarios, cálculo automático de elegibilidad para honorario reducido, generación de credenciales de portal.

## 2. Entidad

Ver PRD sección 5.2. Campos clave: `nombre`, `apellido`, `dni` (único por tenant), `telefono`, `email`, `direccion`, `datos_bancarios` (JSON: CBU, alias, banco, titular), `observaciones`, `portal_usuario`, `portal_password_hash`.

## 3. Endpoints

### 3.1 `POST /owners` (admin, empleado)
**Request:**
```json
{
  "nombre": "string", "apellido": "string", "dni": "string",
  "telefono": "string", "email": "string", "direccion": "string",
  "datosBancarios": { "cbu": "string", "alias": "string", "banco": "string", "titular": "string" },
  "observaciones": "string | null"
}
```
**Response 201.** `dni` único por tenant — si ya existe, 409.

### 3.2 `GET /owners`
Query: `?search=string&conDeuda=true&page=1&limit=20`
Response incluye por cada propietario: cantidad de propiedades activas y si aplica honorario reducido (calculado, no almacenado — ver regla de negocio).

### 3.3 `GET /owners/:id`
Ficha completa + listado de sus propiedades (requiere Fase 6, integrar cuando ambas estén listas) + historial de liquidaciones (placeholder hasta Fase 12).

### 3.4 `PATCH /owners/:id` (admin, empleado)

### 3.5 `PATCH /owners/:id/datos-bancarios` (admin, empleado)
Endpoint separado por ser dato sensible — permite auditar cambios de cuenta bancaria de forma diferenciada (relevante para prevenir fraude: cambio de CBU de un propietario es una acción de riesgo).

### 3.6 `POST /owners/:id/portal-credentials` (admin, empleado)
Genera usuario y contraseña temporal para el portal de autogestión. Devuelve la contraseña generada una única vez (no se puede recuperar después, solo resetear).

### 3.7 `DELETE /owners/:id` (admin)
Soft delete — bloqueado (409) si tiene propiedades activas asociadas.

## 4. Reglas de Negocio

- **DNI único por tenant** (no globalmente — dos inmobiliarias distintas pueden tener el mismo propietario cargado independientemente).
- **Cálculo de honorario reducido (RN-07):** se evalúa dinámicamente, NO se almacena como campo fijo en el propietario. Regla: `COUNT(propiedades WHERE propietario_id = X AND contrato.estado = 'activo') >= tenant.umbral_honorario_reducido (default 3)`. Este cálculo se expone como campo derivado en las responses (`aplicaHonorarioReducido: boolean`, `cantidadPropiedadesActivas: number`) pero el cómputo real y definitivo para la liquidación ocurre en Fase 12, en el momento exacto de generar cada liquidación (evitar duplicar la lógica — centralizarla en un solo helper de dominio reusado por ambos módulos).
- Cambio de datos bancarios queda registrado en auditoría con el interceptor de Fase 1 (`@Audit('owner_bank_data')`).
- Un propietario no puede eliminarse (ni soft) si tiene contratos activos.

## 5. Frontend (Backoffice) — Vertical Slice

### 5.1 Listado de Propietarios
- Tarjetas: nombre completo, cantidad de propiedades, badge "Honorario 3%" si aplica
- Filtro por cantidad de propiedades / con deuda (placeholder hasta Fase 11)

### 5.2 Ficha de Propietario
- Datos personales
- Datos bancarios (con acción de editar separada, posible confirmación extra por ser dato sensible)
- Listado de sus propiedades con estado (integrar con Fase 6)
- Placeholder "Historial de liquidaciones" (Fase 12)
- Botón "Generar acceso a portal"

### 5.3 Alta/Edición
- Formulario completo, validación de DNI único en tiempo real (debounced check contra API)
- Sección de datos bancarios como parte del mismo formulario o paso separado

## 6. Criterios de Aceptación

- [ ] Crear propietario con DNI ya existente en el mismo tenant → 409
- [ ] Crear propietario con mismo DNI en tenant distinto → permitido
- [ ] Un propietario con 3 propiedades activas devuelve `aplicaHonorarioReducido: true` en `GET /owners/:id`
- [ ] Un propietario con 2 propiedades activas y 1 con contrato finalizado devuelve `aplicaHonorarioReducido: false` (solo cuentan activas)
- [ ] Generar credenciales de portal devuelve la password en texto plano una sola vez; un segundo request de reseteo genera una nueva (la anterior deja de servir)
- [ ] Cambiar datos bancarios queda registrado en el log de auditoría
- [ ] Eliminar un propietario con contratos activos → 409

## 7. Casos Borde
- Propietario sin email cargado → no puede generarse credenciales de portal (requiere email para el flujo de notificación) — validar y devolver error claro
- CBU con formato inválido (no 22 dígitos) → validación en DTO, 400
- Dos propietarios con el mismo `alias` de CBU (es válido, alias no es único, pero el CBU numérico sí debería validarse único por tenant para evitar carga duplicada por error — a definir estricto/soft warning en implementación)
