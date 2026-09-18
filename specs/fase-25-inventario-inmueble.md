# Spec — Fase 25: Registro de Inventario del Inmueble

> Resumen simple: sacar fotos y armar un checklist del estado de la propiedad cuando el inquilino entra y cuando se va, para que si hay discusión por el depósito ("esto ya estaba roto" vs "vos lo rompiste"), quede todo documentado con fecha y foto.

**Depende de:** Fase 9 (Contratos) completada.
**Extensión natural del módulo de Contratos** — no es un módulo aislado, vive dentro de la ficha de contrato.
**Prioridad Alta** — bajo costo de desarrollo, alto valor percibido (previene disputas reales y frecuentes del rubro).

---

## 1. Alcance

Checklist fotografiado del estado del inmueble en dos momentos: entrega (inicio de contrato) y devolución (fin/rescisión de contrato). Ambos quedan vinculados al contrato y disponibles como respaldo documental.

> 🏢 **Multi-Tenant y SaaS:** el checklist de inventario y sus categorías son configurables — cada tenant puede eventualmente tener su propia plantilla de checklist (algunas inmobiliarias revisan más ítems que otras), aunque el MVP arranca con una plantilla estándar única.
>
> ✅ **Tests de esta fase deben incluir:** aislamiento entre tenants sobre los registros de inventario, igual que el resto del sistema.
>
> 🧩 **Modularidad (Fase 1, sección 5.1):** este módulo solo se comunica con otros vía su Facade público (`public/`) o mediante eventos del `EventBus` — nunca importando entidades, repositorios o servicios internos de otro módulo directamente.
>
> ☁️ **Infraestructura desacoplada (Fase 1, sección 5.2):** si este módulo usa storage, email, colas o cualquier servicio externo, se accede vía su Port/interfaz (ej. `StoragePort`, `EmailPort`), nunca importando el SDK del proveedor (Cloudinary, Resend, etc.) directamente en el Domain Service — así migrar de Neon/Supabase/Cloudinary/Resend a AWS más adelante es solo un cambio de adapter y configuración.
>
> 🔐 **Secretos y flags (Fase 1, sección 5.3):** las credenciales de esta fase se gestionan en Doppler, nunca hardcodeadas ni en un `.env` compartido. Si esta fase necesita activarse/desactivarse por tenant o probarse gradualmente, usar `FeatureFlagPort` (Flagsmith), no un booleano hardcodeado ni una variable de entorno para eso.
>
> 🌐 **Idioma del código (Fase 1, sección 12):** esta spec nombra entidades y campos en español para que se lea y apruebe fácil — es documentación funcional. El código (clases, variables, columnas, endpoints) se escribe 100% en inglés, traduciendo los nombres al implementar.

## 2. Entidades

### 2.1 `InventarioInmueble`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| contrato_id | FK | — |
| tipo | Enum | `entrega` \| `devolucion` |
| fecha | Date | — |
| realizado_por | FK | usuario (empleado que hizo la inspección) |
| firmado_inquilino | Boolean | si el inquilino confirmó conformidad (ver 4) |
| observaciones_generales | Text | — |
| estado | Enum | `borrador` \| `confirmado` |

### 2.2 `InventarioItem`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| inventario_id | FK | — |
| categoria | String | ej "Cocina", "Baño", "Living", "Instalación eléctrica" |
| descripcion | String | ej "Heladera", "Grifería", "Pintura de paredes" |
| estado_item | Enum | `bueno` \| `regular` \| `malo` \| `no_aplica` |
| observaciones | Text | nullable |
| fotos | Array | URLs Cloudinary, mínimo 1 foto recomendada por ítem con problema |

## 3. Endpoints

### 3.1 `POST /contracts/:contractId/inventory` (admin, empleado)
```json
{
  "tipo": "entrega" | "devolucion",
  "items": [
    { "categoria": "string", "descripcion": "string", "estadoItem": "bueno" | "regular" | "malo" | "no_aplica", "observaciones": "string | null" }
  ]
}
```
Crea el inventario en estado `borrador`. Las fotos se suben después vía el endpoint 3.3, o se aceptan en el mismo request si es multipart (a definir en implementación según UX del formulario).

### 3.2 `GET /contracts/:contractId/inventory`
Lista los inventarios del contrato (normalmente 2: entrega y devolución).

### 3.3 `POST /inventory/:inventoryId/items/:itemId/fotos` (admin, empleado)
Multipart, sube foto(s) a Cloudinary, agrega al array `fotos` del ítem.

### 3.4 `PATCH /inventory/:inventoryId/confirmar` (admin, empleado)
Pasa el inventario de `borrador` a `confirmado` — a partir de acá es **inmutable** (mismo criterio que liquidaciones transferidas: un registro que se usa como prueba no puede editarse después).

### 3.5 `GET /inventory/:inventoryId/comparar` (solo si existen ambos: entrega y devolución)
Devuelve una vista comparativa ítem por ítem entre entrega y devolución, destacando qué ítems cambiaron de estado (`bueno → malo`, por ejemplo) — esto es lo que realmente resuelve una disputa rápido.

## 4. Reglas de Negocio

- Un inventario `confirmado` es inmutable — cualquier corrección requiere crear uno nuevo con nota de por qué se corrige (nunca sobrescribir el original, por la misma lógica de integridad probatoria que la auditoría del sistema).
- **`firmado_inquilino`** representa una confirmación de conformidad del inquilino sobre el checklist — en el MVP puede ser tan simple como un checkbox que el empleado marca en presencia del inquilino ("el inquilino estuvo presente y de acuerdo"), sin necesitar firma digital todavía (eso podría integrarse después con el módulo de firma digital, ver documento de integraciones futuras).
- El inventario de `devolucion` puede crearse recién cuando el contrato está en proceso de finalización/rescisión — no tiene sentido antes.
- Categorías e ítems del checklist: en el MVP, una lista estándar predefinida (Cocina, Baños, Habitaciones, Living/Comedor, Instalación eléctrica, Instalación de gas, Pintura general, Pisos, Aberturas) editable desde Configuración por tenant si se necesita ajustar.

## 5. Frontend (Backoffice)

### 5.1 Dentro de la Ficha de Contrato — nueva sección "Inventario"
- Dos tarjetas: "Inventario de Entrega" y "Inventario de Devolución", cada una con su estado (sin realizar / borrador / confirmado)
- Botón "Realizar inventario" abre un flujo guiado por categoría, con carga de fotos desde cámara del celular (mobile-first — esto se hace literalmente parado en la propiedad con el teléfono)

### 5.2 Vista de Comparación (cuando existen ambos)
- Tabla lado a lado: ítem, estado en entrega, estado en devolución, con highlight visual en los que empeoraron
- Esto es lo que Micaela mostraría/imprimiría si hay que justificar una retención de depósito

## 6. Criterios de Aceptación

- [ ] Crear un inventario de entrega con varios ítems y fotos funciona correctamente
- [ ] Confirmar un inventario lo vuelve inmutable — un intento de editarlo después devuelve 409
- [ ] La vista de comparación identifica correctamente los ítems que cambiaron de estado entre entrega y devolución
- [ ] Un inventario de devolución no puede crearse en un contrato que sigue `activo` sin proceso de finalización iniciado

## 7. Casos Borde
- Contrato que nunca tuvo inventario de entrega (migrado desde Tokko/Excel, contrato viejo) — el sistema permite igual crear un inventario de devolución aislado, con nota de que no hay punto de comparación
- Ítem marcado `malo` sin ninguna foto adjunta — permitir pero mostrar advertencia visual fuerte ("se recomienda adjuntar foto para respaldo"), no bloquear duro
