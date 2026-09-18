# Spec — Fase 22: Portal Público

> Resumen simple: el sitio donde cualquier persona puede ver las propiedades disponibles para alquilar de Oppido y dejar sus datos de contacto si le interesa alguna.

**Depende de:** Fase 6 (Propiedades), Fase 5 (Maestros) completadas.
**No depende de respuestas de Micaela.**
**Sin foco SEO en esta instancia (ver nota en índice de fases) — se retoma si el negocio lo requiere.**

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


Listado público de propiedades disponibles, ficha pública, formulario de contacto que alimenta el futuro CRM (Fase 23).

## 2. Endpoints (públicos, sin autenticación)

### 2.1 `GET /public/properties`
Query: `?ubicacionId=uuid&tipoPropiedadId=uuid&precioDesde=decimal&precioHasta=decimal&page=1&limit=20`
Devuelve **solo** propiedades en estado `disponible`, con un subset de campos (sin datos sensibles de propietario/inquilino).

### 2.2 `GET /public/properties/:id`
Ficha pública completa (fotos, descripción, precio, amenities, ubicación) — 404 si la propiedad no está en estado `disponible` (aunque exista, no se expone si no está disponible).

### 2.3 `POST /public/contact`
```json
{ "nombre": "string", "email": "string", "telefono": "string", "mensaje": "string", "propiedadId": "uuid | null" }
```
Crea un registro de consulta (entidad simple `PublicInquiry`, que Fase 23/CRM consumirá) y dispara notificación interna al equipo de Oppido.

## 3. Reglas de Negocio

- Publicación/despublicación es automática según el `estado` de la Propiedad (Fase 6) — no hay un botón separado de "publicar", el estado `disponible` ya implica visible públicamente.
- El formulario de contacto es público, por lo tanto requiere protección básica contra spam/bots (rate limiting por IP, honeypot field, o similar).

## 4. Frontend (Next.js, `apps/portal`, rutas públicas)

### 4.1 Home / Listado (`/`)
Grilla de propiedades disponibles, filtros de ubicación/tipo/precio.

### 4.2 Ficha de Propiedad (`/propiedades/:id`)
Fotos, descripción, características, formulario de contacto inline.

## 5. Criterios de Aceptación

- [ ] Una propiedad en estado `alquilada` o `en_mantenimiento` no aparece en `GET /public/properties`
- [ ] El formulario de contacto crea el registro y dispara la notificación interna correctamente
- [ ] El rate limiting bloquea envíos masivos automatizados del formulario
- [ ] La ficha pública no expone ningún dato de propietario o inquilino

## 6. Casos Borde
- Propiedad que pasa de `disponible` a `alquilada` mientras alguien tiene la ficha abierta en el navegador → al refrescar o intentar contactar, debe manejarse con gracia (mensaje "esta propiedad ya no está disponible" en vez de error crudo)
