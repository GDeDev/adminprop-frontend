# Spec — Fase 15: Generación de PDFs

> Resumen simple: acá se arma el motor que genera los PDFs reales del sistema (liquidaciones, recibos, informes). El diseño visual exacto de cada uno lo define Micaela en el Anexo A — esta fase deja el motor listo para recibir esas plantillas.

**Depende de:** Fase 12 (Liquidaciones), Fase 11 (Motor de Cobros), Fase 9 (Contratos) completadas.
**El diseño/contenido de cada PDF ya está definido por Micaela (Anexo A) — pasarlo a Claude Code al iniciar esta fase.**

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


Motor de generación de PDF en el backend (sin terceros — librería propia), plantillas para los 4 PDFs generados definidos en el PRD (PDF-01, 03, 04, 05 — el PDF-02 consolidado queda pendiente de CA-02), almacenamiento en Cloudinary.

> ✅ **Anexo A ya definido por Micaela** — usar el contenido y diseño provisto para cada uno de los 4 documentos al implementar las plantillas. Adjuntar/pasar ese material a Claude Code como input de esta fase.

## 2. Librería

**`@react-pdf/renderer`** o **Puppeteer con plantilla HTML** — decisión técnica a tomar en implementación (react-pdf es más liviano y fácil de mantener como componentes; Puppeteer da más flexibilidad de diseño con CSS pero es más pesado). Recomendación: `@react-pdf/renderer` para el MVP por simplicidad y por no requerir un navegador headless corriendo en el servidor.

## 3. PDFs a Implementar en esta Fase

### 3.1 PDF-01 — Liquidación por Propiedad
**Trigger:** al confirmar una liquidación (Fase 12, endpoint `marcar-transferida` o en el momento de generación, a definir).
**Contenido mínimo (genérico hasta Anexo A):** datos de la inmobiliaria (nombre, logo si existe), datos del propietario, datos de la propiedad, período, desglose (canon − honorarios − gastos = neto), fecha de emisión.

### 3.2 PDF-03 — Recibo de Pago de Alquiler
**Trigger:** al registrar un cobro exitoso (Fase 11).
**Contenido:** datos del inquilino, propiedad, período, desglose (base + punitorios si aplica = total pagado), método de pago, fecha.

### 3.3 PDF-04 — Informe Mensual al Propietario
**Trigger:** cron del día `tenant.dia_informe_mensual` (default 10), Fase 13.
**Contenido:** resumen de todas las liquidaciones del propietario en el período (si hay más de una propiedad, esto empieza a superponerse con la eventual consolidada de CA-02 — implementar como un informe simple que lista las liquidaciones del mes, no como reemplazo de CA-02).

### 3.4 PDF-05 — Cálculo de Rescisión Anticipada
**Trigger:** al confirmar una rescisión (Fase 9, endpoint `rescindir`).
**Contenido:** datos del contrato, fecha de notificación, desglose del cálculo de multa (saldo futuro, %, monto final).

## 4. Endpoints

### 4.1 `GET /pdfs/:tipo/:entidadId` (autenticado, valida que el usuario tenga acceso a esa entidad — propietario solo ve sus propias liquidaciones, etc.)
Devuelve la URL de Cloudinary del PDF ya generado (no regenera en cada request — se genera una vez al momento del trigger y se cachea la URL).

### 4.2 Generación interna (no expuesta como endpoint público)
Servicio `PdfGeneratorService` con un método por tipo de documento, invocado desde los handlers de dominio correspondientes (Liquidación, Pago, Rescisión).

## 5. Reglas de Negocio

- Un PDF generado es **inmutable** — si los datos subyacentes cambian después (no debería pasar en liquidaciones `transferidas`, que son inmutables), no se regenera automáticamente; requeriría una acción explícita de "regenerar" con auditoría.
- Todos los PDFs se suben a Cloudinary bajo una carpeta organizada por tenant y tipo (`/{tenant_slug}/liquidaciones/`, `/{tenant_slug}/recibos/`, etc.) para orden y facilidad de auditoría manual si hace falta.
- Los montos en los PDFs usan el mismo helper de formateo de `packages/shared-utils/money.ts` (Fase 1) — consistencia total en cómo se muestra la plata en todo el sistema.

## 6. Criterios de Aceptación

- [ ] Confirmar una liquidación genera el PDF-01 y su URL queda guardada en `pdf_liquidacion`
- [ ] Registrar un cobro genera el PDF-03 (recibo) automáticamente
- [ ] Confirmar una rescisión genera el PDF-05 con el desglose exacto mostrado en la respuesta del endpoint de rescisión (Fase 9)
- [ ] Los PDFs generados son descargables desde el backoffice y (cuando existan) desde los portales de autogestión
- [ ] Un propietario no puede acceder (ni por URL directa si se protege server-side) al PDF de liquidación de otro propietario

## 7. Casos Borde
- Falla la generación del PDF (librería tira error) — no debe frenar la operación de negocio principal (el cobro/liquidación se registra igual), pero debe quedar loggeado y reintentarse o alertar al admin
- Cloudinary caído al momento de subir — reintentar con backoff, y si falla definitivamente, guardar el PDF generado temporalmente y reintentar el upload más tarde (cola simple o reintento manual desde el backoffice)
