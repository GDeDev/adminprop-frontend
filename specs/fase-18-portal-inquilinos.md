# Spec — Fase 18: Portal de Inquilinos

> Resumen simple: igual que el portal de propietarios pero para inquilinos — ven cuánto deben pagar este mes (incluyendo punitorios si se atrasaron), su historial y los datos de su contrato.

**Depende de:** Fase 8 (Inquilinos), Fase 11 (Motor de Cobros), Fase 4 (Auth) completadas.
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


Frontend read-only para inquilinos, dentro de `apps/portal`, rutas `/inquilino/*`.

## 2. Endpoints

- `POST /auth/portal-login` (Fase 4, `tipo: "inquilino"`)
- `GET /renters/me` — resuelve desde JWT
- `GET /billing/pagos/me/desglose?periodo=actual` — estado de cuenta del mes (reusa el endpoint de desglose de Fase 11)
- `GET /billing/pagos/me/historial` — historial de pagos
- `GET /renters/me/contrato` — datos del contrato vigente
- `GET /pdfs/:tipo/:entidadId` (recibos propios)

## 3. Reglas de Negocio

- Mismo criterio que Fase 17: todo resuelto desde JWT, nunca desde parámetro manipulable.
- El desglose de deuda (base + punitorios) se muestra siempre recalculado en tiempo real, no cacheado — un inquilino que entra el día 15 debe ver el punitorio acumulado hasta ese día exacto.

## 4. Frontend (Next.js) — Pantallas

### 4.1 Login (`/inquilino/login`)

### 4.2 Estado de Cuenta (`/inquilino/cuenta`)
Monto del mes, desglose claro de base + punitorios si aplica, con explicación simple de por qué hay un recargo (evita llamados de reclamo innecesarios — mostrar "desde cuándo" se está atrasando).

### 4.3 Historial de Pagos (`/inquilino/pagos`)
Mes a mes con descarga de comprobante/recibo (PDF-03).

### 4.4 Mi Contrato (`/inquilino/contrato`)
Datos vigentes: fechas, monto actual, próxima actualización si aplica.

### 4.5 Contacto
Datos de la inmobiliaria + botón WhatsApp directo (usa el helper de Fase 14).

## 5. Criterios de Aceptación

- [ ] Un inquilino ve su deuda actual con el punitorio correctamente calculado al momento exacto de la consulta
- [ ] Un inquilino no puede acceder a datos de otro inquilino ni por URL directa
- [ ] La descarga de recibo funciona
- [ ] El botón WhatsApp abre correctamente con el contacto de la inmobiliaria

## 6. Casos Borde
- Inquilino sin contrato activo (recién finalizado, sin renovar) → mensaje claro, no error, mostrando el último contrato como referencia histórica
- Inquilino con deuda de más de un período (no pagó dos meses seguidos) → el estado de cuenta debe reflejar el total adeudado de todos los períodos pendientes, no solo el más reciente
