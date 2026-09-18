# Spec — Fase 14: Notificaciones y Mailing (Novu + Resend)

> Resumen simple: todos los mails y avisos automáticos del sistema (recordatorio de pago, aviso de mora, alerta a la aseguradora, etc.) se arman acá, usando Novu para organizar las plantillas y Resend para el envío real.

**Depende de:** Fase 13 (Cron Jobs) completada — son los triggers de la mayoría de estas notificaciones.
**Bloqueante de terceros real:** dominio de Oppido + configuración DNS (SPF/DKIM/DMARC).
**No depende de respuestas de Micaela para la lógica — sí depende de tener acceso al DNS.**

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


Integración de Novu + Resend, definición de los 6 workflows de notificación del PRD, integración WhatsApp vía deep links, notificaciones in-app.

## 2. Setup Inicial

- Cuenta Novu (self-hosted o cloud, definir en implementación — cloud para MVP, más simple)
- Cuenta Resend, configurada como Email Provider dentro de Novu
- Dominio de Oppido verificado en Resend con registros SPF, DKIM y DMARC en el DNS
- Webhook de Resend configurado apuntando a `POST /webhooks/resend`, suscripto a los eventos de la sección 3.1
- Variables de entorno: `NOVU_API_KEY`, `NOVU_APP_ID`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`

## 3. Workflows a Definir en Novu

| Workflow | Trigger (desde Fase 13) | Destinatario(s) | Canal |
|---|---|---|---|
| `recordatorio-pago` | Día 1 del mes | Inquilino | Email + in-app |
| `aviso-mora` | Día 11 (o el día siguiente al fin del período de gracia) | Inquilino + Empleado | Email + in-app |
| `vencimiento-contrato` | 60 días antes del fin | Propietario + Empleado | Email + in-app |
| `servicio-vencido` | 5° día de vencimiento | Inquilino + Empleado | Email + in-app |
| `alerta-aseguradora` | Cierre día 1 sin pago (contrato con caución) | Email externo (aseguradora) | Email únicamente |
| `liquidacion-generada` | Al confirmarse una liquidación (Fase 12) | Propietario | Email + in-app, con PDF adjunto (Fase 15) |

Cada workflow se define en Novu con su plantilla HTML editable desde el dashboard de Novu (esto reemplaza la necesidad de un "editor de plantillas" propio dentro de Adminprop, como sugería el PRD original en Configuración — Novu ya lo resuelve).

## 3.1 Webhooks de Resend — Auditoría de Entrega y Apertura

Resend expone webhooks (firmados con Svix) que notifican en tiempo real el ciclo de vida de cada email enviado: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`, `email.delivery_delayed`. Esto permite tener auditoría real de si una notificación fue efectivamente entregada y abierta, más allá de solo saber que se intentó enviar.

### Endpoint receptor
`POST /webhooks/resend` (público, pero validado por firma Svix — no requiere JWT, requiere verificación de firma del payload contra `RESEND_WEBHOOK_SECRET`)
- Debe responder `200` rápido (menos de 5 segundos) y procesar de forma idempotente (Resend puede reintentar el mismo evento).

### Entidad `EmailEvent`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| resend_email_id | String | id que Resend asigna al envío original |
| tipo_evento | Enum | `sent` \| `delivered` \| `opened` \| `clicked` \| `bounced` \| `complained` \| `delivery_delayed` |
| destinatario | String | email |
| workflow | String | qué notificación era (`recordatorio-pago`, `alerta-aseguradora`, etc.) |
| payload_raw | JSON | el evento completo de Resend, por si hace falta inspeccionar después |
| recibido_en | Timestamp | — |

### Reglas
- Cada evento recibido se guarda en `EmailEvent`, vinculado (si es posible correlacionar por `resend_email_id`) al registro de auditoría original del envío (`@Audit('notification_sent')`).
- Un `email.bounced` o `email.complained` sobre el email de un inquilino/propietario debe generar una alerta in-app al admin — indica que ese contacto puede tener el email mal cargado o esté rechazando el dominio.
- Esta tabla es especialmente relevante para el workflow `alerta-aseguradora` y `aviso-mora`: en un eventual conflicto, poder mostrar "se envió y fue entregado/abierto el [fecha]" tiene valor probatorio operativo (no reemplaza un medio fehaciente legal, pero es mejor que nada).

## 4. Endpoints (API interna, para disparar desde los jobs o desde acciones manuales)

### 4.1 `POST /notifications/trigger` (interno, uso desde otros módulos/jobs, no expuesto públicamente salvo rol admin para reenvíos manuales)
```json
{
  "workflow": "recordatorio-pago",
  "tenantId": "uuid",
  "subscriberId": "uuid (el inquilino/propietario)",
  "payload": { "nombreInquilino": "string", "monto": "string", "periodo": "string", "..." }
}
```
Internamente llama al SDK de Novu (`novu.trigger(...)`).

### 4.2 `GET /notifications/in-app` (autenticado — para la campana de notificaciones del backoffice)
Lista las notificaciones in-app del usuario logueado, vía el feed de Novu.

### 4.3 `PATCH /notifications/in-app/:id/read`

## 5. Integración WhatsApp

- **Solo deep links** (`https://wa.me/<numero>?text=<mensaje_urlencoded>`), sin API de Meta.
- Botón "Contactar por WhatsApp" en Fichas de Propiedad, Inquilino y en el CRM (Fase 23) abre el link en una nueva pestaña/app.
- Las plantillas de texto para WhatsApp son strings configurables (no requieren Novu, son solo texto con variables interpoladas del lado del frontend), guardadas en una tabla simple `whatsapp_templates` editable desde Configuración.

## 6. Reglas de Negocio

- Cada envío exitoso o fallido queda registrado en el log de auditoría (`@Audit('notification_sent')`), incluyendo el workflow, destinatario y resultado.
- Si Resend/Novu falla al enviar un email crítico (ej. `alerta-aseguradora`), debe generarse una notificación in-app interna al admin avisando del fallo — no puede fallar en silencio.
- Los templates deben soportar variables mínimas: `{{nombre}}`, `{{propiedad}}`, `{{monto}}`, `{{periodo}}`, `{{diasMora}}`, `{{fechaVencimiento}}`.

## 7. Frontend (Backoffice)

- Campana de notificaciones in-app en el navbar (usando el widget/componente de Novu si aplica, o consumiendo el feed vía API propia)
- Sección en Configuración con link a Novu para edición de plantillas (o embed del editor si Novu lo permite)
- Botones WhatsApp integrados en las fichas correspondientes (ya definidos en fases anteriores, esta fase provee el helper reutilizable `buildWhatsAppLink(telefono, mensaje)`)

## 8. Criterios de Aceptación

- [ ] Disparar el workflow `recordatorio-pago` manualmente (vía test) envía un email real a través de Resend
- [ ] El email llega a la bandeja principal, no a spam (verificar con SPF/DKIM/DMARC correctamente configurados)
- [ ] Un fallo simulado de Resend genera una notificación in-app interna de alerta
- [ ] El botón WhatsApp genera un link `wa.me` válido con el mensaje pre-cargado y el teléfono formateado (sin espacios, con código de país 54)
- [ ] Las notificaciones in-app se marcan como leídas correctamente y no vuelven a aparecer como no leídas
- [ ] El webhook de Resend recibe y procesa correctamente un evento `email.delivered` y `email.opened` de prueba, guardándolo en `EmailEvent`
- [ ] Un evento duplicado (mismo `resend_email_id` + `tipo_evento`) enviado dos veces por Resend no genera un registro duplicado
- [ ] Un evento `email.bounced` genera una notificación in-app de alerta al admin

## 9. Casos Borde
- Inquilino sin email cargado → el workflow de email falla para ese destinatario puntual pero no debe frenar el resto del batch (ej. si se están notificando 50 inquilinos y uno no tiene email, los otros 49 igual reciben el suyo)
- Teléfono de inquilino/propietario sin código de país → el helper `buildWhatsAppLink` debe asumir +54 por default si el número no lo incluye
- Reintento de envío: si Resend devuelve error temporal (rate limit, timeout), Novu debería reintentar automáticamente según su configuración — verificar comportamiento default y ajustar si hace falta
