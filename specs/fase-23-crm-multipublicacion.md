# Spec — Fase 23: CRM y Multipublicación

> Resumen simple: el módulo comercial. Un tablero para seguir las consultas de gente interesada en alquilar, y la conexión con portales externos (Zonaprop, Argenprop, Mercado Libre) para no cargar cada propiedad dos veces.

**Depende de:** Fase 22 (Portal Público) completada.
**Última fase del roadmap — bloqueante de terceros real, evaluar al momento de encarar.**

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


Pipeline Kanban de consultas, integración WhatsApp desde el CRM, publicación en portales externos, analítica de rendimiento por propiedad.

## 2. Entidad

### 2.1 `PublicInquiry` (ya creada como registro simple en Fase 22, se expande acá)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| nombre, email, telefono | String | — |
| mensaje | Text | — |
| propiedad_id | FK | nullable |
| estado | Enum | `nuevo` \| `contactado` \| `visita_programada` \| `propuesta_enviada` \| `cerrado_ganado` \| `cerrado_perdido` |
| canal_origen | Enum | `portal_publico` \| `zonaprop` \| `argenprop` \| `mercadolibre` \| `manual` |
| asignado_a | FK | usuario interno responsable |

## 3. Endpoints

### 3.1 `GET /crm/pipeline`
Devuelve las consultas agrupadas por estado (shape listo para render de Kanban).

### 3.2 `PATCH /crm/inquiries/:id/estado`
Mueve una consulta entre columnas del Kanban.

### 3.3 `PATCH /crm/inquiries/:id/asignar`
Asigna la consulta a un empleado.

### 3.4 `GET /crm/analytics/:propiedadId`
Vistas y consultas recibidas por propiedad (vistas requiere trackeo simple en Fase 22, a sumar si no existía).

### 3.5 Multipublicación — a definir en implementación según viabilidad comercial de cada portal:
- **Mercado Libre:** tiene API pública (OAuth 2.0) — implementable directamente. `POST /crm/publish/mercadolibre/:propiedadId`.
- **Zonaprop / Argenprop:** requieren acuerdo comercial / feed XML — **no implementable solo con desarrollo**, depende de gestión comercial previa con cada portal. Esta parte de la fase queda bloqueada hasta confirmar el acuerdo.

## 4. Reglas de Negocio

- Toda consulta entrante desde el Portal Público (Fase 22) ingresa automáticamente en estado `nuevo`.
- El botón WhatsApp desde una tarjeta del Kanban usa el helper `buildWhatsAppLink` ya definido en Fase 14, con plantilla configurable.

## 5. Frontend (Backoffice)

### 5.1 Pipeline Kanban
Columnas por estado, tarjetas arrastrables (drag & drop), cada tarjeta muestra nombre, propiedad de interés, canal, fecha.

### 5.2 Configuración de Multipublicación
Sección en Configuración para credenciales de Mercado Libre (OAuth) y, si se resuelve el acuerdo comercial, de Zonaprop/Argenprop.

## 6. Criterios de Aceptación

- [ ] Una consulta del portal público aparece automáticamente en la columna "Nuevo" del Kanban
- [ ] Mover una tarjeta entre columnas actualiza el estado correctamente
- [ ] El botón WhatsApp desde una tarjeta abre el chat con el prospecto correctamente
- [ ] La publicación en Mercado Libre (si se implementa) refleja el estado de publicación en la ficha de propiedad

## 7. Casos Borde
- Consulta sin propiedad asociada (`propiedad_id: null`, consulta general) → debe poder existir en el Kanban igual, sin romper la vista
- Falla de publicación en Mercado Libre (token expirado, rechazo de la API) → estado de publicación queda como "error" visible en la ficha, con opción de reintentar

## 8. Nota de Bloqueante de Terceros
Esta fase **no se puede completar íntegramente solo con desarrollo**. Zonaprop y Argenprop requieren gestión comercial (contrato, feed acordado) antes de que el trabajo técnico tenga sentido. Se recomienda separar esta fase en dos entregas: (a) Kanban + WhatsApp + Mercado Libre (100% desarrollable ya), (b) Zonaprop/Argenprop (depende de gestión comercial externa, evaluar cuándo Oppido decida encararlo).
