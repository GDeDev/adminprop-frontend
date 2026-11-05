# shared-types: tipos generados vs. tipos a mano

Rama `refactor/shared-types-generados` (sobre `feature/web-inmobiliaria-sites`).
Responde al punto 8 de `DEUDA_TECNICA.md` (DT-12: los tipos del contrato HTTP se
generan desde el OpenAPI, no se escriben a mano).

## De dónde salen los tipos generados

`packages/shared-types/src/generated/api.ts` es el que está versionado en el repo
(regenerado en `integration/frontend-3`, ver «Fases 21, 23 y 24»; la
regeneración anterior fue el commit `113d240`, 2026-11-03). Lo que sigue hasta
esa sección describe el estado previo. Se comparó contra
`adminprop-backend/openapi.json` de la rama `feature/web-inmobiliaria-api` del
backend (archivo del 2026-11-04, 283 esquemas): **los 283 esquemas están en el
generado**, así que está al día con esa rama. No se regeneró nada.

Ese OpenAPI **no publica** ninguna ruta de `/crm`, `/listings`, `/migration` ni
`/valuation` (sólo `inquiries`, la versión vieja de consultas). Es decir, el
backend de esa rama es anterior a las Fases 21, 23 y 24, y el generado no puede
cubrir esos tipos.

## Cómo se comparó

Para cada tipo manual se buscó su DTO (por nombre y por el endpoint) y se
comparó con el compilador de TypeScript: asignabilidad en los dos sentidos más
un diff propiedad por propiedad (opcionalidad, `null`, uniones, tipos). Después
se reemplazó, se corrió `tsc` en las 3 apps y los paquetes, y lo que rompía se
corrigió en el uso (ver abajo) o se dejó a mano.

Criterio: se reemplaza sólo si el generado es equivalente o **más estricto**.

## Reemplazado por alias (nombres públicos intactos)

| Archivo             | Tipos                                                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit.ts`          | `AuditEntry`, `AuditCatalog`, `AuditAction`, `AuditActorKind`                                                                                                                                  |
| `documents.ts`      | `GeneratedDocument`, `DocumentKind`, `DocumentStatus`, `TenantSettings`                                                                                                                        |
| `inventory.ts`      | todos (`InventoryPhoto/Item/Summary/Detail`, `ContractInventories`, `InventoryComparison(Row)`, los 4 enums, `CreateInventoryRequest`, `UpdateInventoryItemRequest`, `UpdateInventoryRequest`) |
| `notifications.ts`  | todos los tipos y requests, y los 6 enums derivados de `NotificationLogItem`                                                                                                                   |
| `public-listing.ts` | `PublicPropertySummary`, `PublicPropertyDetail`, `PublicFilters`                                                                                                                               |
| `reports.ts`        | los 14 DTOs; `ReportMeta` pasó a `Pick<DashboardReport, ...>`                                                                                                                                  |
| `site.ts`           | los 7 tipos del sitio y las 2 claves                                                                                                                                                           |
| `site-api.ts`       | `ResetSiteTemplateRequest`, `SitePreviewToken`, `SubdomainAvailability`, `SiteHost`, `SiteDomainRecord`, `SiteDomain`                                                                          |
| `portal.ts`         | `PortalAgency`, `PortalRenterMe`, `PortalPaymentInstructions`, `PortalOwnerMe`                                                                                                                 |
| `common.ts`         | `ApiErrorDetail`                                                                                                                                                                               |

Cambios de comportamiento en tipos al reemplazar (el generado es más estricto):

- `SiteTheme.radius` pasó de `number` a `0 | 8 | 16 | 24`.
- `SiteContent.steps[].icon` pasó de `string` a la lista cerrada de 12 íconos.
- `NotificationTemplateDto.channel` pasó de `NotificationChannel` a lo que el
  OpenAPI declara (sólo `EMAIL`).
- Se corrigieron 2 usos que dependían de lo ancho: `apps/sites/src/lib/theme.test.ts`
  (el test de `radius: 999` ahora lo declara con un cast explícito, porque
  prueba justamente un valor fuera de la unión) y `content-tab.tsx` (`as const`
  en el ícono por defecto).
- Se borró `site.contract.ts`: comprobaba que el OpenAPI fuera asignable a la
  spec escrita a mano; con `site.ts` como alias ya no tiene sentido. También se
  quitaron de `api.ts` los alias `Site*Schema`, que sólo usaba ese archivo.

## Se quedan a mano: difieren del generado (hallazgos)

| Tipo                                                                                                                                   | Diferencia exacta                                                                                                                                                                                                           | Lectura                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UpdateTenantSettingsRequest` (`documents.ts`)                                                                                         | El manual tiene `name`; `UpdateTenantSettingsDto` no lo declara.                                                                                                                                                            | **Posible bug real.** `agency-settings-screen.tsx` siempre manda `body.name`, y el pipe global del backend usa `whitelist: true` + `forbidNonWhitelisted: true` (`custom-validation.pipe.ts`). Guardar los datos de la inmobiliaria debería responder 400 "property name should not exist". No se verificó contra una API corriendo. Hay que decidir si el backend acepta `name` o si el front deja de mandarlo. |
| `AuditChange` / `AuditEntryDetail` (`audit.ts`)                                                                                        | `before`/`after`: manual `unknown`; generado `{} \| null` (objeto vacío o null).                                                                                                                                            | El OpenAPI no puede expresar "cualquier JSON"; el generado es **incorrecto** para valores escalares (strings, números). Backend: anotar el campo con un esquema libre.                                                                                                                                                                                                                                           |
| `ApiError` (`common.ts`)                                                                                                               | `code`: manual `string`; generado, unión cerrada de 38 códigos de infraestructura. `success`: manual `false`; generado `boolean`.                                                                                           | El catálogo cerrado no incluye los códigos de dominio (`DomainException`), así que usarlo rechazaría códigos reales.                                                                                                                                                                                                                                                                                             |
| `ApiSuccess<T>`                                                                                                                        | Genérico en el manual; el generado es `data: {}`.                                                                                                                                                                           | No hay equivalente.                                                                                                                                                                                                                                                                                                                                                                                              |
| `PublicContactRequest` (`public-listing.ts`)                                                                                           | `phone`, `propertyId`, `website`: requeridos en el manual, opcionales en el generado.                                                                                                                                       | El manual es más estricto a propósito (el formulario los exige). No es un desvío del backend.                                                                                                                                                                                                                                                                                                                    |
| `UpdateSiteSettingsRequest` (`site-api.ts`)                                                                                            | `theme.*` y los 11 bloques de `content.*` (`brand`, `contact`, `hero`, `steps`, `featured`, `metrics`, `services`, `testimonials`, `faqs`, `about`, `seo`, `sections`): opcionales en el manual, requeridos en el generado. | El DTO real tiene `theme?: Record<string, unknown>` y `content?: Record<string, unknown>`, pero los decoradores de Swagger apuntan a `SiteThemeDto`/`SiteContentDto` completos, y el OpenAPI describe un body que la API no exige. Backend: anotar el body como parcial.                                                                                                                                         |
| `PortalRenterContract`, `PortalRenterAccount`, `PortalOwnerProperty`, `PortalOwnerAccountProperty`, `PortalOwnerAccount` (`portal.ts`) | `status`, `currency`, `depositCurrency`, `rentUpdateType`, `rentUpdateFrequency`, `depositReturnMode`, `collectionMode`: manual con unión cerrada, generado `string`.                                                       | Faltan los `enum` en los DTOs del portal del backend (los de billing sí los tienen). Reemplazar aflojaría los tipos.                                                                                                                                                                                                                                                                                             |
| `CreateInventoryRequest`                                                                                                               | El manual no tenía `items`; el generado sí (opcional).                                                                                                                                                                      | El generado es un superconjunto compatible; se reemplazó.                                                                                                                                                                                                                                                                                                                                                        |
| `Tenant` (`tenant.ts`)                                                                                                                 | Ni `TenantSettingsDto` ni `TenantBrandingDto` se le parecen (`Tenant` trae parámetros de negocio, `isActive`, `createdAt`).                                                                                                 | No corresponde a ningún endpoint. Sólo lo usa `packages/mocks/src/tenant.ts`. Candidato a borrar junto con el mock.                                                                                                                                                                                                                                                                                              |

## Fases 21, 23 y 24 (`crm`, `listings`, `migration`, `valuation`)

Rama `integration/frontend-3`. `generated/api.ts` se regeneró contra el
`openapi.json` de `integration/consolidado-2` del backend (234 rutas, 325
esquemas), que ya publica `/crm`, `/listings`, `/migration` y `/valuation`. Los
cuatro archivos se compararon tipo por tipo con el compilador (asignabilidad en
los dos sentidos más diff propiedad por propiedad) y los equivalentes pasaron a
alias con los mismos nombres públicos.

Alias del generado: todo `listings.ts` y `valuation.ts`; en `crm.ts` los refs,
`InquiryCard/Activity/Detail`, `PipelineColumn/Dto`, los requests,
`WhatsAppLinkDto`, `CrmAssignee`, `CrmTopProperty`; en `migration.ts` todo salvo
lo de abajo. Las uniones (`InquiryStage`, `ListingStatus`, `ImportEntity`, ...)
se derivan de los campos del generado.

Se quedan a mano, con la diferencia exacta:

| Tipo                                         | Diferencia                                                                                                           | Lectura                                                                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CrmOverviewDto`, `PropertyInquiryAnalytics` | `byStage`, `bySource`: manual `Record<InquiryStage / InquirySource, number>`; generado `{ [key: string]: number }`.  | El generado es más laxo (no obliga las claves). Backend: declarar las claves en `@ApiProperty` (o un esquema con propiedades) si se quiere que el tipo las exija. |
| `ImportCounts`, `ImportBatchSummary`         | `byEntity`: manual `Record<ImportEntity, ImportEntityCounts>`; generado `{ [key: string]: ImportEntityCountsDto }`.  | Igual que arriba.                                                                                                                                                 |
| `ImportBatchDetail`                          | El generado trae `errorMessage: string \| null` (requerido); el manual no lo tiene (y además hereda lo de `counts`). | **Diferencia real.** El front no muestra el mensaje de error del lote. Candidato a agregarlo a `ImportBatchDetail` y mostrarlo en la pantalla de migración.       |

Hallazgos del contrato (backend o front), encontrados al regenerar:

1. **OpenAPI inválido en el backend.** `ImportCountsDto.byEntity` referencia
   `#/components/schemas/ImportEntityCountsDto`, que no está en
   `components.schemas` (falta `@ApiExtraModels(ImportEntityCountsDto)` en
   `migration.dtos.ts`). `openapi-typescript` aborta con "Can't resolve $ref".
   Para generar se le agregó ese esquema (los 5 campos numéricos de la clase) a
   una copia temporal del JSON; el `openapi.json` del backend no se tocó.
   **Mientras no se arregle allá, `npm run api:types` falla.**
2. **Coordenadas públicas.** El OpenAPI no publica `latitude`/`longitude` en
   `PublicPropertyDetailDto` y el backend no las devuelve en el módulo `public`,
   pero `apps/sites` (`propiedades/[id]/page.tsx`) las lee para el mapa. Hoy el
   mapa nunca se muestra con datos reales. Los campos se declaran opcionales en
   `public-listing.ts` (ya no se edita `generated/api.ts`). Hay que sumarlos en
   el backend o sacar el mapa.
3. **Enums nuevos** que el front tuvo que cubrir: `AlertType` /
   `NotificationType` con `COMPARABLES_SOURCE_STALE`, `INQUIRY_FOLLOW_UP`,
   `INQUIRY_ASSIGNED`, `LISTING_CHANNEL_ERROR` (etiquetas en
   `automations.ts` y `notifications.ts`); códigos de error
   `VALUATION_DAILY_LIMIT` y `LISTING_NOT_READY`.
4. **`needsReview`** pasó a requerido en `PropertySummaryDto` y
   `PropertyDetailDto` y es opcional en `UpdatePropertyDto` (migración).
5. Los esquemas `PublicInquiryDto`, `InquiryPropertyDto` y
   `UpdateInquiryStatusDto` (consultas viejas) ya no existen; ninguna app los
   usaba.
6. `LUXURY` ya lo publica el backend (se quitó el retoque manual).

## No son DTOs, se quedan

`common.ts` (alias escalares, `Timestamps`), `user.ts` (`AccessTokenClaims` y
roles de la URL), `PublicListingQuery` (parámetros de query) y `ReportFormat`.

## Guardia contra tipos a mano

`packages/shared-types/src/no-manual-dto.test.ts` (corre con `npm test`, o sea
en el pre-commit y en `turbo test`) falla si alguien declara a mano una
`interface` o un `type X = { ... }` cuyo nombre coincide con un esquema
generado (`X` o `XDto`). Es un chequeo por nombre: no detecta un DTO a mano con
otro nombre. Las excepciones viven en `KNOWN_DIFFERENCES`, con el motivo, y el
test también falla si una entrada queda vieja.

## `formatMoney`

Hay una sola implementación en `packages/ui/src/lib/format-money.ts`
(`@adminprop/ui/lib/format-money`). Backoffice (`lib/contracts.ts`) y portal
(`lib/format.ts`) la re-exportan. Quedaron dos diferencias de comportamiento
respecto de la copia del portal: ahora un texto que no es número se muestra tal
cual (antes salía "NaN"), y se reemplaza cualquier espacio especial, no sólo el
NBSP. `apps/sites` mantiene `formatPrice` a propósito: es otro formato (prefijo
`US$`, sin decimales en enteros, "Consultar" sin precio) y esa app no depende de
`@adminprop/ui`.
