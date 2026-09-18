# Spec — Fase 6: Propiedades

> Resumen simple: acá se puede cargar una propiedad con su dirección, fotos, tipo y ubicación, y verla en un listado con filtros. Es el primer módulo "de negocio" real — el primer momento donde se ve la app funcionando con datos.

**Depende de:** Fase 5 (Maestros) completada.
**No depende de respuestas de Micaela.**
**Primer vertical slice (back + front juntos).**

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


CRUD completo de Propiedades, upload de fotos a Cloudinary, gestión de estados, listado con filtros y búsqueda.

## 2. Entidad

Ver PRD sección 5.1. Campos clave: `direccion`, `ubicacion_id` (FK a Maestros), `tipo_propiedad_id` (FK), `estado` (enum), `propietario_id` (FK — nullable en esta fase si Propietarios aún no existe; **ver nota de dependencia cruzada abajo**), `amenities` (array de FKs), `servicios`, `observaciones`, `fotos` (array de URLs Cloudinary).

> **Nota de dependencia cruzada:** el campo `propietario_id` referencia a la entidad Propietario (Fase 7). Como Fase 6 se ejecuta antes, la FK se crea pero **nullable** en esta fase, y el flujo de alta de propiedad permite guardar sin propietario asignado (se completa después) O, si se prefiere, se ejecuta Fase 6 y 7 en paralelo (ambas dependen solo de Fase 5) y se integra el selector de propietario al cerrar ambas. **Decisión sugerida: ejecutar 6 y 7 en paralelo, integrar al final.**

## 3. Endpoints

### 3.1 `POST /properties` (admin, empleado)
**Request:**
```json
{
  "direccion": "string",
  "ubicacionId": "uuid",
  "tipoPropiedadId": "uuid",
  "propietarioId": "uuid | null",
  "amenityIds": ["uuid"],
  "observaciones": "string | null"
}
```
**Response 201:** la propiedad creada, `estado: "disponible"` por default.

### 3.2 `GET /properties`
Query params: `?estado=disponible&propietarioId=uuid&tipoPropiedadId=uuid&search=string&page=1&limit=20`
**Response 200:** lista paginada `{ items: [...], total, page, limit }`

### 3.3 `GET /properties/:id`
Ficha completa. Incluye datos expandidos de ubicación, tipo, amenities (no solo IDs), y — si ya existe Fase 9 — el contrato activo.

### 3.4 `PATCH /properties/:id` (admin, empleado)
Edición de cualquier campo excepto `estado` (que tiene su propio endpoint por la lógica de transición) y `fotos` (endpoint propio).

### 3.5 `PATCH /properties/:id/estado` (admin, empleado)
**Request:** `{ "estado": "disponible" | "alquilada" | "en_mantenimiento" }`
Ver reglas de transición abajo.

### 3.6 `POST /properties/:id/fotos` (admin, empleado)
Multipart upload, múltiples archivos. Sube a Cloudinary, devuelve las URLs agregadas al array `fotos`.
**Límite:** máximo 20 fotos por propiedad (validación en backend).

### 3.7 `DELETE /properties/:id/fotos/:fotoId` (admin, empleado)
Elimina una foto puntual del array (y opcionalmente de Cloudinary).

### 3.8 `DELETE /properties/:id` (admin)
Soft delete — solo si no tiene contratos históricos asociados; si los tiene, devolver 409 con mensaje claro ("no se puede eliminar, tiene historial de contratos — desactivar en su lugar").

## 4. Reglas de Negocio

- **Transiciones de estado válidas:**
  - `disponible → alquilada`: automática al crear un contrato (Fase 9), o manual (uso raro, ej. reserva).
  - `alquilada → disponible`: automática al finalizar/rescindir un contrato.
  - `cualquiera → en_mantenimiento`: manual, en cualquier momento.
  - `en_mantenimiento → disponible`: manual.
  - **No permitida:** `disponible → alquilada` manual si ya existe un contrato activo para esa propiedad (validar).
- Una propiedad en `alquilada` no puede pasar a `disponible` manualmente si tiene un contrato en estado `activo` (debe pasar por rescisión/finalización de contrato — Fase 9).
- Propiedad en estado `en_mantenimiento` o `alquilada` no aparece en el portal público (Fase 22) — solo `disponible`.

## 5. Frontend (Backoffice) — Vertical Slice

### 5.1 Listado de Propiedades
- Vista de tarjetas (mobile) / tabla (desktop)
- Cada tarjeta: foto principal, dirección, tipo, badge de estado con color, propietario
- Filtros: estado, tipo, propietario (dropdown desde Maestros/Fase 7)
- Buscador por dirección (debounced)
- Paginación o infinite scroll (mobile-first → infinite scroll preferido)
- Skeleton loader mientras carga

### 5.2 Ficha de Propiedad
- Carrusel de fotos
- Datos completos, badges de estado
- Sección propietario (si existe) con link
- Sección amenities (chips)
- Placeholder de "Contrato activo" y "Historial de pagos" (se completan cuando existan Fases 9 y 11 — dejar el espacio en el layout)

### 5.3 Alta/Edición (wizard)
- Paso 1: dirección, ubicación (selects en cascada usando `<MasterDataSelect>` de Fase 5), tipo
- Paso 2: propietario (selector, o "asignar después")
- Paso 3: amenities (multi-select)
- Paso 4: fotos (upload con preview, drag to reorder opcional)
- Guardado en borrador local (localStorage) si el usuario sale a mitad del wizard

## 6. Criterios de Aceptación

- [ ] Crear una propiedad con datos válidos devuelve 201 y la propiedad queda en estado `disponible`
- [ ] Crear una propiedad sin `direccion` devuelve 400
- [ ] Subir 21 fotos a una propiedad devuelve 400 en la foto 21
- [ ] Listar propiedades filtrando por `estado=disponible` devuelve solo esas
- [ ] Buscar por dirección parcial ("Av. Corrientes") encuentra coincidencias parciales (ILIKE)
- [ ] Cambiar estado a `alquilada` manualmente sin contrato asociado es permitido (caso reserva), pero cambiar a `disponible` estando `alquilada` con contrato activo es rechazado (409)
- [ ] Eliminar una propiedad con historial de contratos devuelve 409 con mensaje claro
- [ ] El listado en mobile muestra tarjetas legibles sin scroll horizontal
- [ ] Un usuario de un tenant no puede ver (ni por ID directo) propiedades de otro tenant → 404

## 7. Casos Borde
- Propiedad sin fotos → la ficha muestra un placeholder, no rompe el carrusel
- `ubicacion_id` o `tipo_propiedad_id` que referencia un maestro desactivado → se permite mostrar (dato histórico) pero no se puede seleccionar en altas nuevas
- Upload de foto que falla a mitad de Cloudinary → no debe dejar el array de fotos en estado inconsistente (transacción o rollback del intento)
