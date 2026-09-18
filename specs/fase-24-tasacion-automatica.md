# Spec — Fase 24: Tasación Automática de Alquiler (Módulo Nuevo)

> Resumen simple: cuando se carga una propiedad nueva, en vez de que Micaela tenga que "tirar un precio a ojo" mirando otros avisos a mano, el sistema sugiere un rango de precio comparando propiedades similares de la zona.

**Depende de:** Fase 6 (Propiedades), Fase 5 (Maestros — Ubicaciones) completadas.
**Módulo independiente y opcional** — no bloquea ningún flujo core; se integra como una sugerencia dentro del alta/edición de Propiedad (Fase 6), sin ser obligatoria.
**Prioridad post-MVP** — evaluar después de cerrado el core financiero.

---

## 1. Alcance

Motor de tasación que sugiere un rango de precio de alquiler para una propiedad, basado en comparables de mercado de la misma zona/tipo/superficie, combinando scraping de fuentes públicas con un agente de IA que interpreta y pondera los resultados.

> 🏢 **Multi-Tenant y SaaS:** los comparables de mercado son datos públicos y compartidos entre todos los tenants (no hay motivo para que cada inmobiliaria scrapee por separado) — la caché de comparables vive a nivel global del sistema, no por tenant. La tasación en sí (input: la propiedad de un tenant, output: una sugerencia) sí respeta el aislamiento normal.
>
> 🧩 **Modularidad (Fase 1, sección 5.1):** este módulo solo se comunica con otros vía su Facade público (`public/`) o mediante eventos del `EventBus` — nunca importando entidades, repositorios o servicios internos de otro módulo directamente.
>
> ☁️ **Infraestructura desacoplada (Fase 1, sección 5.2):** si este módulo usa storage, email, colas o cualquier servicio externo, se accede vía su Port/interfaz (ej. `StoragePort`, `EmailPort`), nunca importando el SDK del proveedor (Cloudinary, Resend, etc.) directamente en el Domain Service — así migrar de Neon/Supabase/Cloudinary/Resend a AWS más adelante es solo un cambio de adapter y configuración.
>
> 🔐 **Secretos y flags (Fase 1, sección 5.3):** las credenciales de esta fase se gestionan en Doppler, nunca hardcodeadas ni en un `.env` compartido. Si esta fase necesita activarse/desactivarse por tenant o probarse gradualmente, usar `FeatureFlagPort` (Flagsmith), no un booleano hardcodeado ni una variable de entorno para eso.
>
> 🌐 **Idioma del código (Fase 1, sección 12):** esta spec nombra entidades y campos en español para que se lea y apruebe fácil — es documentación funcional. El código (clases, variables, columnas, endpoints) se escribe 100% en inglés, traduciendo los nombres al implementar. Es además uno de los módulos con menos dependencias del core financiero, buen candidato a extracción temprana si el scraping requiere una infraestructura separada (ej. workers dedicados).

## 2. Enfoque Técnico Propuesto

Dado que no existe una API pública y confiable de tasación para el mercado argentino, el enfoque es de dos etapas:

### 2.1 Etapa 1 — Recolección de Comparables (scraping)
- Un worker (similar en espíritu al scraper de Tokko ya armado) consulta periódicamente los portales públicos con datos de alquiler visibles (Zonaprop, Argenprop, Mercado Libre Inmuebles) filtrando por ubicación/tipo/superficie similar a la propiedad a tasar.
- Se extraen: precio publicado, ubicación, tipo, superficie, amenities, antigüedad de la publicación.
- Los resultados se guardan en una tabla propia `comparables_mercado` (no se muestran directamente al usuario, son insumo del paso 2), con fecha de scraping para poder descartar datos viejos.
- **Nota técnica:** esto es scraping de portales de terceros, no una API oficial — sujeto a que esos sitios cambien su estructura HTML y rompan el scraper periódicamente (mismo riesgo ya identificado con el scraper de Tokko). Requiere mantenimiento continuo, no es "configurar una vez y listo".

### 2.2 Etapa 2 — Tasación (agente de IA)
- Cuando el empleado pide tasar una propiedad, el sistema junta los comparables relevantes ya scrapeados (misma zona/tipo/rango de superficie, publicados en los últimos N días) y se los pasa a un agente de IA (vía API de Claude u otro LLM) con un prompt estructurado.
- El agente devuelve: un rango sugerido (mínimo-máximo), un precio central sugerido, y una breve justificación en texto ("basado en 8 comparables de la zona, con amenities similares, el rango de mercado está entre $X y $Y").
- **No es un cálculo puramente estadístico** (aunque podría complementarse con uno, ej. mediana de comparables) — usar el agente permite ponderar factores cualitativos (estado de conservación, amenities específicos) que un promedio simple no captura bien.

## 3. Entidad

### 3.1 `ComparableMercado`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| fuente | Enum | `zonaprop` \| `argenprop` \| `mercadolibre` |
| ubicacion_id | FK | mapeado al maestro de Ubicaciones (Fase 5) |
| tipo_propiedad_id | FK | — |
| superficie_m2 | Decimal | nullable si no se pudo extraer |
| precio | Decimal | — |
| moneda | Enum | ARS \| USD |
| amenities_detectados | Array | texto libre extraído, no necesariamente mapeado a maestros |
| url_original | String | — |
| fecha_scraping | Timestamp | — |

### 3.2 `TasacionSolicitud`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| propiedad_id | FK | — |
| rango_sugerido_min | Decimal | — |
| rango_sugerido_max | Decimal | — |
| precio_sugerido | Decimal | — |
| justificacion | Text | respuesta del agente |
| cantidad_comparables_usados | Integer | — |
| solicitado_por | FK | usuario |
| fecha | Timestamp | — |

## 4. Endpoints

### 4.1 `POST /valuation/tasar/:propiedadId` (admin, empleado)
Dispara el proceso: busca comparables relevantes ya cacheados, invoca al agente, guarda y devuelve el resultado.
**Response:**
```json
{
  "rangoMin": "decimal", "rangoMax": "decimal", "precioSugerido": "decimal",
  "justificacion": "string", "cantidadComparablesUsados": "number"
}
```
Si no hay suficientes comparables (ej. menos de 3) para la zona/tipo, devuelve 422 con mensaje claro ("no hay suficientes datos de mercado para esta zona todavía").

### 4.2 `GET /valuation/historial/:propiedadId`
Historial de tasaciones previas de esa propiedad (útil para ver cómo evolucionó la sugerencia en el tiempo).

## 5. Reglas de Negocio

- La tasación es **siempre una sugerencia**, nunca un valor que se auto-aplica al campo de precio de la Propiedad — el empleado decide si la usa o no.
- Los comparables usados no deben tener más de 30-45 días de antigüedad (configurable) para evitar sugerir con datos de mercado desactualizados.
- El costo de invocar al agente de IA por cada tasación debe controlarse (rate limit por tenant o por día) para evitar costos descontrolados si se usa masivamente.

## 6. Frontend (Backoffice)

- Botón "Sugerir precio" dentro del formulario de alta/edición de Propiedad (Fase 6), en el paso donde se carga el precio
- Muestra el rango + justificación en un bottom sheet, con opción de "usar este precio" (autocompleta el campo) o descartar

## 7. Criterios de Aceptación

- [ ] El scraper de comparables corre periódicamente y guarda datos frescos sin duplicar entradas ya existentes de la misma publicación
- [ ] Pedir tasación de una propiedad con suficientes comparables devuelve un rango razonable con justificación
- [ ] Pedir tasación de una propiedad en una zona sin datos devuelve 422 con mensaje claro, no un error crudo
- [ ] El precio sugerido nunca se auto-aplica sin acción explícita del usuario

## 8. Casos Borde
- Scraper bloqueado por el portal de origen (captcha, cambio de estructura HTML) — debe fallar de forma controlada y loggear el fallo, sin romper el resto del sistema; considerar espaciar el scraping para no ser bloqueado por volumen de requests
- Comparables con precios muy dispersos (outliers, ej. una propiedad claramente mal cargada a $1 o con un cero de más) — el agente debe poder ignorar outliers evidentes en su ponderación, o filtrarlos estadísticamente antes de pasarlos al agente

## 9. Nota de Viabilidad
Este módulo depende de scraping continuo de sitios de terceros que no ofrecen API pública para este dato — es la parte de mayor mantenimiento y mayor riesgo de rotura silenciosa de todo el roadmap. Se recomienda: (a) monitoreo activo de que el scraper sigue funcionando (alertas si deja de traer datos nuevos), y (b) evaluar si en el futuro alguno de estos portales lanza una API oficial de tasación que reemplace la necesidad de scrapear.
