# Spec — Fase 10: Servicios Asociados

> Resumen simple: acá se configura qué servicios tiene cada propiedad (luz, gas, expensas, etc.), quién los paga, y se registran los gastos que el inquilino adelanta y que después se le descuentan al propietario.

**Depende de:** Fase 6 (Propiedades), Fase 9 (Contratos) completadas.
**No depende de respuestas de Micaela.**
**Vertical slice (back + front juntos).**

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


CRUD de servicios por propiedad/contrato, control de vencimientos, registro de gastos adelantados por inquilino.

## 2. Entidades

### 2.1 ServicioPropiedad
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| propiedad_id | FK | — |
| contrato_id | FK | nullable — puede existir a nivel propiedad antes de tener contrato |
| tipo_servicio_id | FK | Maestro (Fase 5) |
| quien_paga | Enum | `inquilino` \| `propietario` |
| moneda | Enum | ARS \| USD |
| tiene_vencimiento | Boolean | — |
| fecha_vencimiento | Date | nullable |
| tiene_aumento | Boolean | — |
| frecuencia_aumento | Enum | nullable |
| gestionado_inmobiliaria | Boolean | — |
| observaciones | Text | — |
| estado | Enum | `al_dia` \| `vencido` (calculado) |

### 2.2 GastoAdelantado
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| contrato_id | FK | — |
| inquilino_id | FK | — |
| monto | Decimal | — |
| descripcion | String | — |
| comprobante_url | String | Cloudinary |
| fecha | Date | — |
| descontado_en_liquidacion_id | FK | nullable — se completa cuando Fase 12 lo procesa |
| registrado_por | FK | usuario que lo cargó |

## 3. Endpoints

### 3.1 Servicios

**`POST /properties/:propertyId/services`** (admin, empleado)
```json
{
  "tipoServicioId": "uuid", "quienPaga": "inquilino" | "propietario",
  "moneda": "ARS" | "USD", "tieneVencimiento": "boolean",
  "fechaVencimiento": "date | null", "tieneAumento": "boolean",
  "frecuenciaAumento": "string | null", "gestionadoInmobiliaria": "boolean",
  "observaciones": "string | null"
}
```

**`GET /properties/:propertyId/services`** — lista de servicios de una propiedad

**`PATCH /services/:id`** (admin, empleado)

**`DELETE /services/:id`** (admin, empleado)

**`GET /services/vencidos`** (admin, empleado) — lista global de servicios vencidos para el dashboard, filtrable por propiedad

### 3.2 Gastos Adelantados

**`POST /contracts/:contractId/gastos-adelantados`** (admin, empleado)
Multipart (incluye comprobante).
```json
{ "monto": "string (decimal)", "descripcion": "string", "fecha": "date" }
```

**`GET /contracts/:contractId/gastos-adelantados`** — lista, con filtro `?descontado=true|false`

**`DELETE /gastos-adelantados/:id`** (admin) — solo si `descontado_en_liquidacion_id IS NULL` (no se puede borrar un gasto ya aplicado a una liquidación cerrada)

## 4. Reglas de Negocio

- Un servicio pasa a `estado: vencido` automáticamente cuando `fecha_vencimiento < hoy` (calculado, no cron — se computa on-read; el cron de Fase 13 es el que dispara la notificación a partir del 5° día vencido, RN-13).
- Un gasto adelantado con `descontado_en_liquidacion_id` seteado queda **inmutable** (no se puede editar ni eliminar) — es un registro contable ya cerrado.
- El descuento real de gastos adelantados en la liquidación ocurre en Fase 12; esta fase solo registra el gasto, no lo aplica.

## 5. Frontend (Backoffice) — Vertical Slice

### 5.1 Servicios (dentro de la Ficha de Propiedad, sección propia)
- Tabla de servicios: tipo, quién paga, vencimiento, badge de estado
- Alta rápida (bottom sheet) con los campos condicionales según `tiene_vencimiento`/`tiene_aumento`

### 5.2 Gastos Adelantados (dentro de la Ficha de Contrato)
- Listado con comprobante descargable
- Alta con upload de comprobante (foto o PDF)
- Badge "Pendiente de descuento" / "Descontado en liquidación #X" (link a la liquidación cuando exista Fase 12)

## 6. Criterios de Aceptación

- [ ] Crear un servicio con `tieneVencimiento: true` sin `fechaVencimiento` → 400
- [ ] Un servicio con fecha de vencimiento pasada aparece como `vencido` en `GET /services/vencidos`
- [ ] Registrar un gasto adelantado sin comprobante → 400 (comprobante obligatorio, es plata que se descuenta a un tercero)
- [ ] Eliminar un gasto ya `descontado_en_liquidacion_id` seteado → 409
- [ ] El listado de gastos adelantados de un contrato refleja correctamente cuáles están pendientes vs. descontados

## 7. Casos Borde
- Servicio marcado `gestionado_inmobiliaria: false` — igual se puede registrar vencimiento, solo cambia si la inmobiliaria gestiona el pago o es informativo
- Gasto adelantado cargado en un contrato que se rescinde antes de liquidarse → queda pendiente, debe considerarse en el cierre de cuentas de la rescisión (nota para Fase 12: verificar que la liquidación final de un contrato rescindido contemple gastos adelantados pendientes)
