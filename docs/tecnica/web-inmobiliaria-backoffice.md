# Sitio web de la inmobiliaria — backoffice (frontend)

Contrato: `adminprop-repo-files/specs/web-inmobiliaria.md` (secciones 5 y 6.2). Tipos en `shared-types/src/site.ts` (equivalente en contenido a la spec 5.1) y `site-api.ts` (requests y extras del backend); API regenerada en `generated/api.ts`. Comportamiento exacto de la API: `adminprop-backend/docs/tecnica/web-inmobiliaria.md` y D-177 a D-189. Decisiones del frontend: DT-107 a DT-114. La app pública (`apps/sites`) es de otra sesión: acá solo se arma la URL de la vista previa.

## Qué hay

**`packages/ui`**: `Accordion` (shadcn sobre `radix-ui`), con test.

**`lib/site.ts`** (puro, con tests): límites de la spec, lista cerrada de íconos, estado del sitio (`siteStatus`), contraste WCAG (`contrastRatio`, `themeContrastChecks`: texto/fondo y texto/tarjeta ≥ 4,5 y principal/fondo ≥ 3, las mismas reglas con las que la API rechaza publicar), `moveItem`/`removeItem`, `buildDraftPatch` (PUT parcial), mapeo de errores 422 (`siteErrorList`, `resolveFieldPath`, `mapFieldErrors`, `blocksWithErrors`) y la URL de la vista previa.

**`lib/site-api.ts`**: hooks de TanStack Query para `GET /site/templates`, `GET|PUT /site/settings`, `POST /site/settings/reset-template`, `POST /site/publish|unpublish`, `POST /site/assets`, `GET /site/preview-token` (se renueva solo antes de vencer) y `GET /site/subdomain-availability`. Cada mutación de configuración deja en caché el `SiteSettings` que devuelve.

**`app/(dashboard)/sitio-web/`**

| Archivo                                                         | Qué hace                                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `site-screen.tsx`                                               | Puerta de ADMIN, carga/error/vacío, estado local del borrador, guardar/publicar/despublicar/cambiar template, diálogos, resumen de errores. |
| `status-card.tsx`, `template-picker.tsx`, `template-mockup.tsx` | Estado y URL (copiar/abrir), tarjetas de template con mini-maqueta pintada con `defaultTheme`.                                              |
| `design-tab.tsx`                                                | 5 colores (selector + hex), contraste AA en vivo, tipografía (`fontOptions` del template), esquinas 0/8/16/24.                              |
| `content-tab.tsx` + `fields.tsx`                                | Acordeón de 11 bloques; campos con contador, listas con agregar/quitar/mover, imágenes con vista previa y quitar.                           |
| `sections-tab.tsx`                                              | Orden (subir/bajar) y visibilidad (Switch).                                                                                                 |
| `domain-tab.tsx`                                                | Subdominio (disponibilidad con debounce) y dominio propio, cada uno con su botón y fuera del borrador.                                      |
| `preview-panel.tsx`                                             | Iframe escalado (375/768/1280).                                                                                                             |
| `use-unsaved-guard.ts`                                          | `beforeunload` y confirmación al tocar links internos.                                                                                      |

**Propiedades** (`propiedades/property-form.tsx`, ficha, `lib/properties.ts`): paso «Publicación» del wizard y de la edición, y bloque «Publicación» en la ficha. Detalle en DT-113.

**Menú**: `Mi sitio web` (`/sitio-web`, ícono `Globe`) en el sidebar y en «Más» de mobile, solo para ADMIN (`visibleNavItems`).

## Flujos

- **Guardar**: `buildDraftPatch(draft guardado, copia local)` → `PUT /site/settings`; con éxito se descarta la copia local y se recarga el iframe.
- **Publicar**: confirmación → si hay cambios, se guardan primero → `POST /site/publish`. En 422 se listan los problemas en el diálogo y se marcan los campos.
- **Template**: `PUT {template}` (con lo pendiente) y, si se acepta, `POST reset-template {keepContent: true}`.
- **Dominio**: `PUT {subdomain}` / `PUT {customDomain}` al instante; `null` los quita.

## Tests

- `lib/site.test.ts` (27): contraste, estado, mover/quitar, PUT parcial, mapeo de errores, URL del iframe.
- `sitio-web/site-screen.test.tsx` (25): acceso, tres estados del badge, guardar solo lo cambiado, contraste en vivo, 422 junto al campo y resumen, publicar con confirmación y con 422, despublicar, template (restaurar / conservar / cancelar), preguntas (agregar, mover, quitar, máximo, contador), secciones, aviso al salir, vista previa, dominio, texto plano.
- `packages/ui/.../accordion.test.tsx`; `lib/navigation.test.ts`; `lib/properties.test.ts`; `property-form.test.tsx` y `property-detail.test.tsx` ampliados.

## Pendiente / no verificado

- No se vio en un navegador ni contra la API real: todo está probado con la API mockeada (jsdom). Responsive 375/768/1280 y foco/contraste se cuidaron por construcción (targets de 44 px, tokens, `focus-visible`) pero no se midieron.
- `apps/sites` tiene que aceptar `/_s/<slug>?preview=<token>` y permitir ser embebida desde el origen del backoffice.
- Variables nuevas (opcionales): `NEXT_PUBLIC_SITES_URL` (default `http://localhost:3003`) y `NEXT_PUBLIC_SITES_DNS_TARGET`.
- El botón «atrás» del navegador no pasa por el aviso de cambios sin guardar (DT-111).
- El backoffice no valida el largo de los textos: muestra el contador y la API devuelve el error por campo.

## Segunda ronda (revisión de los PR)

- **Guarda de rol** (`admin-gate.tsx`, DT-133): un empleado que entra a `/sitio-web` por URL ve «Sólo para administradores».
- **Dominio propio verificado** (`domain-tab.tsx`): estado Verificado / Falta verificar, registro TXT (host y valor) con botones de copiar, «Verificar dominio» (deshabilitado si hay un dominio escrito sin guardar) y los avisos `DOMAIN_NOT_VERIFIED` y `DOMAIN_TAKEN`. Con la verificación apagada (desarrollo) el dominio se muestra verificado al cargarlo. Hooks `useSiteDomain` y `useVerifySiteDomain` en `lib/site-api.ts`.
