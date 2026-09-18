# Spec — Fase 21: Migración de Datos (ETL)

> Resumen simple: la herramienta para traer toda la cartera actual de Oppido desde Tokko (y desde el Excel que usan hoy) hacia Adminprop, de una sola vez, sin tener que cargar todo a mano.

**Depende de:** Fase 5 (Maestros), Fase 6 (Propiedades), Fase 7 (Propietarios), Fase 8 (Inquilinos), Fase 9 (Contratos) completadas.
**No depende de respuestas de Micaela para la lógica — sí requiere la API key real de Oppido en Tokko.**

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


Importador desde Tokko vía API (usando y evolucionando el script `tokko_scraper_v2.js` ya armado), importador desde Excel, migración de assets a Cloudinary.

## 2. Importador Tokko

### 2.1 Proceso
1. Ejecutar el scraper (ya armado) con la API key real de Oppido
2. Los JSON generados (`properties_sample.json`, diccionarios, `locations_summary.json`) se procesan con un script de mapeo que:
   - Mapea los tipos de propiedad de Tokko a los Maestros de Adminprop (creando los que falten)
   - Mapea las ubicaciones de Tokko a la tabla jerárquica de Ubicaciones (creando la jerarquía si no existe)
   - Mapea amenities/tags de Tokko a Amenities de Adminprop
3. Un script de importación final crea las Propiedades en Adminprop usando los IDs ya mapeados de los maestros

### 2.2 Endpoint (uso interno/admin, no un flujo público)
`POST /migration/tokko/import` (solo `admin`)
```json
{ "dryRun": "boolean" }
```
Con `dryRun: true`, procesa y devuelve un reporte de qué se importaría (cuántas propiedades, cuántos maestros nuevos se crearían, cuántos errores) sin persistir nada — crítico para revisar antes de la carga real.

### 2.3 Reporte de Importación
```json
{
  "propiedadesProcesadas": "number",
  "propiedadesImportadas": "number",
  "propiedadesConError": [{ "tokkoId": "string", "error": "string" }],
  "maestrosCreados": { "ubicaciones": "number", "tiposPropiedad": "number", "amenities": "number" }
}
```

## 3. Importador Excel

### 3.1 Template
- Se genera un `.xlsx` descargable con columnas predefinidas (una hoja por entidad: Propietarios, Inquilinos, Propiedades, Contratos) y validaciones de Excel (dropdowns para campos enum donde sea posible)

### 3.2 Endpoint
`POST /migration/excel/preview` (multipart, admin) — sube el archivo, devuelve preview con errores por fila detectados (fila 5: DNI faltante, fila 12: tipo de propiedad no reconocido, etc.) sin persistir nada.

`POST /migration/excel/import` (admin) — confirma la importación de las filas válidas (permite excluir las que tienen error e importar el resto).

## 4. Migración de Assets

- Para cada propiedad importada de Tokko con fotos, descarga las imágenes desde las URLs externas y las resube a Cloudinary (no se referencian URLs externas directamente — todo pasa a ser propio).
- Reporte de assets migrados/fallidos por propiedad.

## 5. Reglas de Negocio

- La importación **nunca sobrescribe** datos ya cargados manualmente en Adminprop — si una propiedad con la misma dirección/DNI ya existe, se reporta como conflicto y requiere decisión manual (skip o merge), nunca automático.
- Todo el proceso de importación queda registrado en auditoría como una operación masiva (`@Audit('bulk_import')`).
- El `dryRun` es obligatorio como paso previo recomendado en el flujo de UI — no se oculta ni se salta fácilmente.

## 6. Frontend (Backoffice, solo Admin)

### 6.1 Pantalla de Migración
- Botón "Importar desde Tokko" → corre dry-run → muestra reporte → botón "Confirmar importación"
- Sección "Importar desde Excel" → descargar template, subir archivo, preview de errores, confirmar

## 7. Criterios de Aceptación

- [ ] El dry-run de Tokko no persiste ningún dato, solo reporta
- [ ] La importación real crea correctamente propiedades, mapeando maestros nuevos cuando corresponde
- [ ] Una propiedad con dirección duplicada a una ya existente se reporta como conflicto, no se importa automáticamente
- [ ] El preview de Excel detecta filas con errores antes de confirmar
- [ ] Las fotos migradas de Tokko quedan alojadas en Cloudinary propio, no como referencia externa

## 8. Casos Borde
- Propiedad de Tokko sin ubicación definida → se importa igual, con `ubicacion_id: null`, marcada para revisión manual posterior (no bloquea el resto del batch)
- Excel con una hoja faltante (ej. no incluye la hoja de Garantes) → el importador debe procesar las hojas presentes y avisar cuáles faltan, sin fallar todo el proceso
- Timeout en la descarga de una imagen externa de Tokko → se reporta como asset fallido para esa propiedad puntual, no frena el resto de la importación
