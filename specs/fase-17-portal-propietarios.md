# Spec — Fase 17: Portal de Propietarios

> Resumen simple: el sitio donde cada propietario entra con su usuario y contraseña para ver sus propiedades, cuánto le deben liquidar, y descargar sus comprobantes — sin tener que llamar a la inmobiliaria para preguntar.

**Depende de:** Fase 7 (Propietarios), Fase 12 (Liquidaciones), Fase 4 (Auth — login de portal ya implementado) completadas.
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


Frontend read-only para propietarios, dentro de `apps/portal` (Next.js), bajo rutas protegidas `/propietario/*`.

## 2. Endpoints (consumidos, la mayoría ya existen de fases anteriores con el guard de rol `propietario` aplicado)

- `POST /auth/portal-login` (Fase 4, ya existe)
- `GET /owners/me` — variante de `GET /owners/:id` que resuelve el propietario desde el JWT del portal (el propietario no puede pasar un ID arbitrario)
- `GET /owners/me/properties` — sus propiedades
- `GET /settlements?propietarioId=me&periodo=actual` — estado de cuenta del mes
- `GET /settlements/owner/me/historial` — historial completo
- `GET /pdfs/:tipo/:entidadId` (ya existe, Fase 15 — valida que el propietario solo acceda a sus propios PDFs)

## 3. Reglas de Negocio

- Todo endpoint bajo `/owners/me/*` resuelve el `propietario_id` desde el JWT, **nunca** desde un parámetro que el cliente pueda manipular — esto es crítico para que un propietario jamás pueda ver datos de otro cambiando un ID en la URL.
- El portal es 100% de solo lectura — ningún endpoint de escritura está expuesto a este rol.

## 4. Frontend (Next.js) — Pantallas

### 4.1 Login (`/propietario/login`)
Formulario simple, usa `POST /auth/portal-login` con `tipo: "propietario"`.

### 4.2 Mis Propiedades (`/propietario/propiedades`)
Listado de sus propiedades con estado (disponible/alquilada/mantenimiento).

### 4.3 Estado de Cuenta (`/propietario/cuenta`)
Resumen del mes actual: liquidaciones pendientes/confirmadas del período.

### 4.4 Liquidaciones (`/propietario/liquidaciones`)
Historial completo, cada una con botón de descarga de PDF.

### 4.5 Historial de Pagos (`/propietario/pagos`)
Mes a mes, por propiedad — de sus inquilinos (solo lo que le compete ver, no datos personales sensibles del inquilino más allá de nombre).

### 4.6 Contacto
Datos estáticos de la inmobiliaria (teléfono, email, dirección).

## 5. Criterios de Aceptación

- [ ] Un propietario logueado ve únicamente sus propias propiedades y liquidaciones
- [ ] Intentar acceder a `GET /settlements/:id` de una liquidación que no le pertenece → 404 (no 403, mismo criterio que Fase 1)
- [ ] La descarga de PDF funciona correctamente desde el portal
- [ ] El portal es usable desde mobile sin scroll horizontal

## 6. Casos Borde
- Propietario sin ninguna propiedad cargada todavía (recién dado de alta) → pantalla vacía con mensaje claro, no error
- Sesión expirada mientras navega el portal → redirect a login sin perder el intento de acción (opcional: volver a la misma pantalla tras re-login)
