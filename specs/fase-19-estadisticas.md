# Spec — Fase 19: Estadísticas y Reportes

> Resumen simple: el panel de números — cuánto entró este mes, cuántas propiedades están alquiladas, quién debe, y todo exportable a Excel para que Micaela pueda llevárselo a su contador o analizarlo aparte.

**Depende de:** Fase 11 (Cobros), Fase 12 (Liquidaciones), Fase 6-9 (Propiedades/Contratos) completadas.
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


Dashboard principal, reportes financieros, operativos, por propietario e inquilino, exportación a XLSX y PDF.

## 2. Endpoints

### 2.1 `GET /dashboard/resumen`
```json
{
  "alquileresCobrados": "decimal", "alquileresPendientes": "decimal", "alquileresEnMora": "decimal",
  "cantidadPropiedadesAlquiladas": "number", "cantidadDisponibles": "number",
  "contratosPorVencer": "number", "serviciosVencidos": "number"
}
```
Todo calculado para el período actual del tenant logueado.

### 2.2 `GET /reports/financiero`
Query: `?periodo=2026-06&tipo=ingresos|honorarios|pagados|vencidos|punitorios`

### 2.3 `GET /reports/operativo`
Query: `?tipo=alquiladas|disponibles|por-vencer|servicios-pendientes`

### 2.4 `GET /reports/propietario/:id`
Ingresos generados, historial de pagos, estado de propiedades — todo en un solo response agregado.

### 2.5 `GET /reports/inquilino/:id`
Historial de pagos, deuda actual, contratos activos.

### 2.6 `GET /reports/:tipo/export?format=xlsx|pdf`
Devuelve el archivo descargable del reporte solicitado.

## 3. Reglas de Negocio

- Todos los reportes son **read-only** y agregados — no exponen operaciones de escritura.
- Los cálculos de reportes financieros usan los mismos helpers de `money.ts` (Fase 1) que el resto del sistema — nunca se recalculan montos con lógica propia y distinta.
- Los reportes respetan el aislamiento multi-tenant (vía el `TenantScopedRepository` de Fase 1) automáticamente.

## 4. Frontend (Backoffice)

### 4.1 Dashboard Principal
Cards de resumen + accesos rápidos a las acciones más frecuentes (registrar cobro, ver contratos por vencer).

### 4.2 Pantalla de Reportes
Tabs por categoría (financiero/operativo/propietario/inquilino), selector de período, gráficos simples (barras/líneas) usando una librería liviana (ej. Recharts), botón de exportación en cada vista.

## 5. Criterios de Aceptación

- [ ] El dashboard carga en menos de 2 segundos con datos reales del período actual
- [ ] La exportación a XLSX genera un archivo válido y abrible en Excel
- [ ] La exportación a PDF genera un documento legible con los datos correctos
- [ ] Los reportes de un tenant nunca incluyen datos de otro tenant (test explícito de aislamiento)

## 6. Casos Borde
- Período sin ningún dato (mes recién empezado, sin cobros aún) → gráficos y reportes muestran "sin datos" en vez de romper o mostrar NaN/undefined
- Exportación de un reporte muy grande (muchos períodos históricos) — paginar la generación si es necesario para no timeoutear
