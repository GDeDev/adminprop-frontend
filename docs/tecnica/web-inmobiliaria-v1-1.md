# Sitio web v1.1 — documentación técnica (frontend)

Rama `feature/web-inmobiliaria-v1-1-sites`, desde `feature/web-inmobiliaria-sites`. Backend en paralelo: `feature/web-inmobiliaria-v1-1-api`. Decisiones DT-141 a DT-149 en `DECISIONES_TECNICAS.md`. Base: [`web-inmobiliaria.md`](web-inmobiliaria.md) y [`web-inmobiliaria-backoffice.md`](web-inmobiliaria-backoffice.md).

## Qué se hizo

| Punto                    | Dónde                                                                                                                                                                         | Notas                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Orden por fecha y precio | `lib/listing-query.ts` (`sort`, `withSortCurrency`), `components/sort-links.tsx`, `PublicListingSort` en shared-types                                                         | `recent` no viaja; `price_*` va con `currency` (DT-141/142) |
| Favoritos y compartir    | `lib/favorites.ts`, `components/favorites-store.ts`, `favorite-button.tsx`, `favorites-list.tsx`, `app/s/[site]/favoritos`, `app/s/[site]/api/favoritos`, `whatsappShareLink` | DT-143/144                                                  |
| Template `LUXURY`        | `templates/luxury/*`, `--site-font-display` en `globals.css`                                                                                                                  | DT-145                                                      |
| Mapa OSM                 | `lib/osm.ts`, `components/property-map.tsx`, `frame-src` en `apps/sites/next.config.ts`                                                                                       | DT-146                                                      |
| Tasá tu propiedad        | `lib/valuation-request.ts`, `components/valuation-form.tsx`, `app/s/[site]/tasacion`                                                                                          | DT-147                                                      |
| Autoguardado             | `apps/backoffice/.../sitio-web/site-screen.tsx`                                                                                                                               | DT-148                                                      |
| Miniaturas               | `apps/backoffice/public/templates/*.png`, `template-picker.tsx`, `TEMPLATE_THUMBNAILS`                                                                                        | DT-149                                                      |

Las rutas nuevas (`/favoritos`, `/tasacion`) tienen su reexport en `app/p/[site]/…` (vista previa). `/tasacion` está en el sitemap; `/favoritos` es `noindex`.

## Contrato con el backend

- `GET /public/:slug/properties?sort=recent|price_asc|price_desc` (otro valor: 400; sin precio queda al final); mandar `currency` con `price_*`.
- `SiteTemplateKey` suma `LUXURY` (mayúsculas). El front tolera un template desconocido (cae en CLASSIC; el editor muestra el nombre de la API).
- `PublicPropertyDetail.latitude/longitude`: **opcionales**; el mapa aparece solo cuando llegan. Es un supuesto de este lado: confirmar con el backend que los expone.
- «Tasá tu propiedad» no tiene endpoint propio: usa `POST /public/:slug/contact`.

## Seguridad y CSP

- `apps/sites`: única ampliación, `frame-src https://www.openstreetmap.org`. El resto de la CSP no cambia (test en `src/next-config.test.ts`). Backoffice: sin cambios de CSP.
- Favoritos: los ids de `localStorage` y de `?ids=` se validan como UUID antes de usarse; el texto compartido es plano y solo con links `https`.
- Nada de `dangerouslySetInnerHTML`; todo texto del usuario sigue como texto de React.

## Capturas y miniaturas

Las capturas de `docs/capturas-web-inmobiliaria/v1-1/` (375 y 1280 px, los tres templates: inicio, listado ordenado, favoritos, ficha con el mapa cerrado y abierto, tasación) y las miniaturas se generaron con Playwright (Chromium) contra `apps/sites` en modo desarrollo y una **API pública simulada** (datos de ejemplo, no la API real). Para regenerarlas: levantar una API que responda `/public/:slug/site|properties|filters` con un sitio por template, correr `next dev --port 3013` con `API_URL` y `SITES_IMAGE_SOURCES` apuntando a ella, y fotografiar `/_s/<slug>/` a 1280×800 con `deviceScaleFactor: 0.5` (miniatura de 640×400).

**El mapa de las capturas sale en blanco**: el entorno donde se sacaron no tiene salida a openstreetmap.org. Ver el mapa renderizado queda pendiente de probar con red.

## Cómo se probó

Ver el informe del PR. Tests nuevos: `listing-query`, `favorites`, `favorite-button`, `favorites-list`, ruta `api/favoritos`, `osm`, `property-map`, `next-config` (CSP), `valuation-request`, `valuation-form`, templates (LUXURY), `template-picker` y cuatro casos de autoguardado en `site-screen.test.tsx`.
