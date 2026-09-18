# Spec — Fase 5: Maestros

> Resumen simple: son las "listas desplegables" del sistema — tipos de propiedad, barrios, amenities, tipos de servicio. En vez de escribirlas a mano cada vez, viven en su propia tabla y todo el resto del sistema las referencia. Esto es clave porque vamos a migrar datos reales de Tokko y necesitamos que todo quede prolijo y consistente.

**Depende de:** Fase 4 (Auth) completada.
**Bloqueante de:** Fase 6 (Propiedades) y Fase 9 (Contratos), que referencian estos maestros.
**No depende de respuestas de Micaela.**

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


CRUD de las 5 tablas de maestros definidas en el PRD (sección 5.8): Ubicación (jerárquica), Tipo de Propiedad, Amenities, Tipo de Operación, Tipo de Servicio. Todas con borrado lógico.

## 2. Entidades

Ver PRD sección 5.8 para el detalle completo de campos. Resumen:

- **Ubicación** (`locations`): jerárquica auto-referenciada (`parent_id`), campo `tipo` (Pais/Provincia/Localidad/Barrio)
- **TipoPropiedad** (`property_types`): nombre, activo
- **Amenity** (`amenities`): nombre, icono, activo
- **TipoOperacion** (`operation_types`): nombre, activo
- **TipoServicio** (`service_types`): nombre, activo

> Todos globales por defecto (no llevan `tenant_id`), salvo que un tenant quiera sus propios maestros custom — en el MVP son compartidos entre tenants (si llega a haber más de uno). Si se necesita personalización por tenant a futuro, se agrega `tenant_id NULLABLE` (NULL = global, seteado = específico del tenant) sin romper lo existente.

## 3. Endpoints (repetidos por cada uno de los 5 maestros, mismo patrón)

Ejemplo con Tipo de Propiedad, aplica igual a Amenity, TipoOperacion, TipoServicio:

- `GET /property-types` — lista, filtro `?activo=true` por default
- `GET /property-types/:id`
- `POST /property-types` (solo `admin`) — `{ nombre: string }`
- `PATCH /property-types/:id` (solo `admin`) — editar nombre
- `PATCH /property-types/:id/deactivate` (solo `admin`) — soft delete (`activo = false`)
- `PATCH /property-types/:id/activate` (solo `admin`) — reactivar

### 3.1 Ubicaciones (caso especial por ser jerárquica)
- `GET /locations?tipo=barrio&parent_id=uuid` — lista filtrable por tipo y padre (para poblar selects en cascada: elegís provincia → trae localidades → elegís localidad → trae barrios)
- `GET /locations/tree` — devuelve el árbol completo anidado (para la vista de administración tipo árbol)
- `POST /locations` — `{ tipo: string, nombre: string, parent_id: uuid | null }`
- `PATCH /locations/:id`
- `PATCH /locations/:id/deactivate`

## 4. Reglas de Negocio

- **No se elimina físicamente ningún maestro** que tenga referencias activas (propiedades usándolo). Solo `deactivate`.
- Un maestro desactivado **no aparece en los selectores de alta/edición** pero sigue siendo válido para registros históricos que ya lo usan (no rompe integridad referencial ni oculta datos pasados).
- Validación: no se puede crear una Ubicación tipo "Barrio" sin `parent_id` (jerarquía obligatoria salvo el nivel raíz "País").
- Nombres únicos dentro del mismo nivel jerárquico y mismo padre (no puede haber dos barrios "Palermo" bajo la misma localidad).

## 5. Seed Inicial

- Script de seed que carga los maestros base: tipos de propiedad comunes (Casa, Departamento, PH, Local, Oficina, Terreno), tipos de operación (Alquiler, Venta, Temporario), amenities comunes (Pileta, Cochera, Parrilla, Balcón, Terraza, Ascensor).
- **Las Ubicaciones NO se seedean a mano** — se cargan desde la migración de datos de Tokko (scraper `tokko_scraper_v2.js`, endpoint `get_search_summary`) para asegurar que coincidan con la cartera real de Oppido. Si los datos de Tokko no están listos al momento de esta fase, cargar manualmente País Argentina + Provincia Buenos Aires + 2-3 localidades de prueba, y completar después con el import real.

## 6. Frontend (Backoffice)

- Pantalla `Configuración > Maestros` con tabs o sub-secciones por cada tipo de maestro
- Ubicaciones: vista de árbol expandible/colapsable
- Resto: listado simple con toggle activo/inactivo y alta rápida (modal/bottom sheet)
- Estos selectores (Tipo de Propiedad, Ubicación, Amenities) se consumen como dropdowns/multi-select en los formularios de Propiedades (Fase 6) — implementar acá un componente reutilizable `<MasterDataSelect>` que las fases siguientes reusan

## 7. Criterios de Aceptación

- [ ] Seed corre y carga los maestros base sin errores
- [ ] `GET /locations/tree` devuelve la jerarquía correctamente anidada
- [ ] Crear un Barrio sin `parent_id` devuelve 400
- [ ] Desactivar un Tipo de Propiedad que tiene propiedades asociadas no falla, pero deja de aparecer en `GET /property-types?activo=true`
- [ ] Un `empleado` no puede crear/editar maestros (solo `admin`) → 403
- [ ] El componente `<MasterDataSelect>` renderiza opciones desde la API y soporta selección múltiple (para Amenities) y única (para Tipo de Propiedad)

## 8. Casos Borde
- Intentar crear un maestro con nombre duplicado en el mismo nivel → 409 Conflict
- Reactivar un maestro cuyo padre está desactivado (caso Ubicación) → permitir pero advertir en el frontend, no bloquear en backend
