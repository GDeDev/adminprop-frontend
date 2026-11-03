# Fase 14 — Notificaciones y mailing (frontend)

Contrato: `adminprop-repo-files/docs/REDISENO_FASE_14.md`. Tipos a mano en `shared-types/src/notifications.ts` (+ `AsyncJobStatus` en `automations.ts`). Decisiones DT-89 a DT-93.

- `lib/notifications-api.ts` (TanStack Query, endpoints exactos del rediseño sección 5), `lib/notifications.ts` (etiquetas, estados, cronología, helpers de variables), `lib/jobs-api.ts` (`useJobStatus`), `lib/whatsapp.ts` (`buildWhatsAppLink`, `fillTemplate`).
- `/configuracion/notificaciones` (admin): pestañas Eventos y canales, Plantillas, Historial y WhatsApp.
- `/perfil`: Mis notificaciones.
- `components/whatsapp-button.tsx` + `tenant-name.tsx`; usados en `inquilinos/[id]` y `cobros/[id]`.
- Campana: `AlertType`/`alertIconKind` en `lib/automations.ts`, íconos en `dashboard/internal-alerts.tsx`.
- Tests: whatsapp, notifications (lógica), notifications-screen (settings, editor, historial con progreso), my-notifications, whatsapp-button.
- Depende del backend (aún no existe): todos los endpoints, `/jobs/:id/status` para `notifications-resend-failed`, `GET /notifications/whatsapp-templates` accesible a empleados. Agency name/banco de las plantillas de WhatsApp: el cliente sólo completa lo que recibe.
- **No visto en un navegador** (sin API).
