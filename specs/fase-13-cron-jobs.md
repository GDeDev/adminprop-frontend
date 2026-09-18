# Spec — Fase 13: Cron Jobs y Workers

> Resumen simple: son las tareas que corren solas, sin que nadie las apriete. Generan las cuotas del mes, calculan los punitorios día a día, avisan de contratos por vencer, y controlan pólizas de seguro vencidas.

**Depende de:** Fase 11 (Motor de Cobros), Fase 9 (Contratos), Fase 10 (Servicios) completadas.
**Contiene una consulta pendiente (fuente de índices).**

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


Todos los jobs automáticos del sistema. `@nestjs/schedule` dispara el disparador de tiempo (el "a qué hora"), pero el trabajo real se encola en **pg-boss** (`CronPort`/`QueuePort`, ver Fase 1 sección 5.2) en vez de ejecutarse directo en el handler del cron — esto da, gratis, lo que en la versión anterior de esta spec eran casos borde a resolver a mano: reintentos automáticos si el job falla, y protección nativa contra doble ejecución si el proceso llega a escalar a más de una instancia.

## 2. Jobs a Implementar

### 2.1 `GenerarCuotasMensualesJob`
- **Cron:** día `tenant.dia_generacion_cuotas` (default 28) de cada mes, 00:00
- **Acción:** invoca `POST /billing/generar-cuotas` (Fase 11) para cada tenant activo
- **Idempotencia:** crítica — si el cron corre dos veces el mismo día (reinicio del proceso, doble deploy), no debe duplicar cuotas

### 2.2 `CalcularPunitoriosDiarioJob`
- **Cron:** todos los días, 00:05 (después de medianoche)
- **Acción:** recorre todos los Pagos en estado `pendiente` o `con_mora` cuyo período ya pasó el `dias_gracia_pago`, recalcula `monto_punitorios` según la fórmula confirmada en Fase 11, actualiza `monto_total`
- Si CA-01 se resuelve con log diario: este job también inserta una fila en `punitorio_log` por cada pago afectado

### 2.3 `ActualizarIndicesJob`
- **Cron:** diario, 06:00 (los índices oficiales suelen publicarse a la mañana)
- **Acción:** obtiene el valor vigente de ICL/IPC desde la fuente configurada y lo guarda en tabla `indices` (nueva entidad, ver abajo)
- Si la fuente falla, genera una notificación interna de alerta (no falla silenciosamente)

> ⚠️ **CONSULTA A MICAELA (menor prioridad, no bloquea el arranque del MVP, pero sí esta fase puntual):**
> ¿Cuál es la fuente que hoy usan para el índice ICL/IPC? El PRD menciona "ARQUILER" como referencia, pero conviene confirmar si es scraping de un sitio (frágil, puede romperse si cambian el HTML) o si existe una fuente de datos oficial más estable (el BCRA publica el ICL). Preferimos integrar contra una fuente oficial si existe, en vez de un scraper.
> **Mientras no se responda:** se deja el job con la integración a ARQUILER como estaba definido en el PRD original, marcado como **reemplazable** — la interfaz del job no cambia si se cambia la fuente después, solo la implementación interna del fetch.

### 2.4 `AvisoVencimientoContratoJob`
- **Cron:** diario, 08:00
- **Acción:** busca contratos activos con `fecha_fin` a exactamente `tenant.dias_aviso_vencimiento` días de hoy, dispara notificación (Fase 14) a propietario y empleado

### 2.5 `AvisoServicioVencidoJob`
- **Cron:** diario, 08:00
- **Acción:** busca servicios con `fecha_vencimiento` a exactamente 5 días de atraso (RN-13), dispara notificación a inquilino y empleado

### 2.6 `ControlVencimientoPolizaJob`
- **Cron:** diario, 08:00
- **Acción:** dos chequeos — (a) contratos con `poliza_vencimiento` a 30 días → notificación de aviso; (b) contratos con `poliza_vencimiento < hoy` → marca el contrato con flag visual "Caución vencida" (campo calculado o `estado_caucion` en el Contrato)

### 2.7 `AlertaAseguradoraJob`
- **Cron:** diario, cierre del día 1 del mes (23:55) — o alternativamente corre a las 00:05 del día 2, evaluando "no se pagó durante el día 1" (ambas son válidas, elegir una y documentar)
- **Acción:** busca Pagos del período actual, contrato con `tiene_caucion: true`, `estado != pagado` → envía email automático a `aseguradora_email_alerta` (RN-10)

## 3. Entidad Nueva: `Indice`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| tipo | Enum | `ICL` \| `IPC` |
| periodo | String | ej "2026-06" |
| valor | Decimal | — |
| fuente | String | de dónde se obtuvo |
| fecha_obtencion | Timestamp | — |

## 4. Reglas de Negocio

- **Todos los jobs son idempotentes a nivel de negocio** (correr la lógica dos veces no debe duplicar efectos), y además corren encolados vía **pg-boss**, que da de base: reintento automático si el handler tira una excepción, y (si se usa la opción `singletonKey` de pg-boss por período) protección contra que el mismo job se encole dos veces para el mismo período.
- Los jobs corren **por tenant** — si hay más de una inmobiliaria en el futuro, cada una usa sus propios parámetros (`tenant.dia_generacion_cuotas`, etc.), no un valor global. Cada tenant encola su propio job en pg-boss, no un job global que itera tenants adentro (así un tenant con muchos datos no bloquea el procesamiento del resto).
- Cada ejecución de job queda registrada en un log simple (`job_execution_log`: nombre del job, timestamp, resultado, cantidad de registros afectados) para poder auditar si corrió y qué hizo — sin esto, un job que falla silenciosamente es invisible. pg-boss también guarda su propio historial de intentos, pero `job_execution_log` es el registro de negocio (qué hizo, no solo si corrió).

## 5. Criterios de Aceptación

- [ ] Ejecutar `GenerarCuotasMensualesJob` dos veces seguidas el mismo día no duplica cuotas
- [ ] `CalcularPunitoriosDiarioJob` actualiza correctamente el monto de un pago vencido de un día para el otro
- [ ] Si `ActualizarIndicesJob` falla (fuente caída), no rompe el resto de los jobs y genera una alerta interna visible en el dashboard
- [ ] `AvisoVencimientoContratoJob` no notifica dos veces el mismo contrato en días distintos (solo dispara el día exacto del umbral, no todos los días desde que entra en rango)
- [ ] `ControlVencimientoPolizaJob` marca correctamente un contrato como "Caución vencida" cuando corresponde
- [ ] Cada ejecución queda registrada en `job_execution_log`

## 6. Casos Borde
- El servidor está caído el día 28 (no corre `GenerarCuotasMensualesJob`) — al reiniciar, `@nestjs/schedule` dispara el próximo tick programado, pero si se necesita "recuperar" el job del día exacto que se perdió, agregar igual una verificación explícita ("¿ya se generaron las cuotas de este período?") antes de encolar, en vez de asumir que el cron nunca se saltea un disparo
- Dos jobs que tocan la misma entidad corren en paralelo (ej. `CalcularPunitoriosDiarioJob` y un registro de cobro manual simultáneo) — usar transacciones/locks a nivel de fila en Postgres para evitar condiciones de carrera; pg-boss evita que el mismo job se duplique a sí mismo, pero no reemplaza el lock de fila necesario cuando dos procesos *distintos* tocan el mismo registro
