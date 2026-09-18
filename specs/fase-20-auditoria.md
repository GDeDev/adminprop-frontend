# Spec — Fase 20: Auditoría y Trazabilidad

> Resumen simple: un registro de "quién hizo qué y cuándo" que no se puede borrar ni editar. Sirve para investigar cualquier duda o disputa (ej. "¿quién cambió el CBU de este propietario?").

**Depende de:** el `AuditInterceptor` ya definido y usado desde Fase 1 en adelante (esta fase expone la pantalla de consulta, la captura ya viene ocurriendo desde antes).
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


Pantalla de consulta del log de auditoría (la captura de eventos ya está distribuida en las fases anteriores vía el interceptor). Esta fase se enfoca en exponerlo de forma útil y garantizar su inmutabilidad a nivel de base de datos.

## 2. Entidad

Ver PRD sección 18. Tabla `audit_log`: usuario, acción, entidad, entidad_id, timestamp, estado_anterior (JSON), estado_nuevo (JSON), tenant_id.

## 3. Endpoints

### 3.1 `GET /audit-log` (solo `admin`)
Query: `?usuario=uuid&accion=string&entidad=string&fechaDesde=date&fechaHasta=date&page=1&limit=50`

### 3.2 `GET /audit-log/:id` (solo `admin`)
Detalle completo de un evento, con diff legible entre estado anterior y nuevo.

## 4. Reglas de Negocio

- **Inmutabilidad garantizada a nivel de base de datos**, no solo de aplicación: revocar permisos de UPDATE/DELETE sobre la tabla `audit_log` para el usuario de aplicación de la API (o usar un trigger de Postgres que rechace cualquier UPDATE/DELETE sobre esa tabla). Esto es más fuerte que solo "no exponer el endpoint" — protege incluso ante un bug o acceso directo a la DB.
- Todos los eventos definidos en el PRD (sección 18.2) deben estar cubiertos por el `@Audit()` decorator en sus respectivos handlers, verificar checklist completo al cerrar esta fase.

## 5. Frontend (Backoffice)

### 5.1 Pantalla de Auditoría (`Admin > Auditoría`)
Tabla filtrable, cada fila expandible mostrando el diff antes/después de forma legible (no JSON crudo — renderizado amigable, ej. "honorarios_pct: 5% → 3%").

## 6. Criterios de Aceptación

- [ ] Un `empleado` no puede acceder a `GET /audit-log` → 403
- [ ] Intentar hacer UPDATE o DELETE directo sobre `audit_log` desde el usuario de aplicación de la DB falla (verificar a nivel de permisos de Postgres, no solo de código)
- [ ] Cambiar datos bancarios de un propietario (Fase 7) genera una entrada en el log con el diff correcto
- [ ] Anular un pago (acción de admin) genera una entrada de auditoría
- [ ] El filtro por rango de fechas funciona correctamente

## 7. Casos Borde
- Volumen alto de eventos (miles de registros con el tiempo) — la pantalla debe paginar eficientemente, considerar índices en `tenant_id`, `entidad`, `fecha` desde la migración inicial de la tabla
- Un evento de auditoría sobre una entidad que después se elimina físicamente (soft delete en la práctica, pero por las dudas) — el log debe conservar la información aunque la entidad ya no exista, no debe depender de un JOIN que se rompa
