# Sitios web de las inmobiliarias — documentación técnica (`apps/sites`)

Spec: `adminprop-repo-files/specs/web-inmobiliaria.md` (sesión B). Backend: rama `feature/web-inmobiliaria-api`. Editor del backoffice: ver [`web-inmobiliaria-backoffice.md`](web-inmobiliaria-backoffice.md). Decisiones DT-115 a DT-126 en `DECISIONES_TECNICAS.md`. Rama `feature/web-inmobiliaria-sites`, desde `feature/fase-24-tasacion-automatica`.

## Qué se construyó

- `packages/shared-types/src/site.ts`: **la sección 5.1 de la spec, verbatim** (se verificó byte a byte contra el bloque de la spec al crearlo). Extras del backend en `site-api.ts`; alias del OpenAPI y `site.contract.ts` (comprobación de tipos, un solo sentido). `generated/api.ts` regenerado desde el `openapi.json` real del backend.
- `apps/sites` (puerto 3003): Next 16.3.5, Tailwind 4, sin NextUI/MUI, sin sesión ni cookies.
- Pantalla «Mi sitio web» y campos de propiedad en el backoffice (ver doc del backoffice).

## Cómo resuelve la inmobiliaria

1. `src/proxy.ts` mira el `Host`: `<sub>.<SITES_BASE_DOMAIN>` o dominio propio → `GET /public/site-by-host` (caché 30 s). En desarrollo también `http://localhost:3003/_s/<slug>/…`.
2. Reescribe a `/s/<sitio>/…` (público, ISR) o `/p/<sitio>/…` (vista previa, sin caché). `<sitio>` = `h|d|hp|dp ~ slug [~ token]` (`lib/site-route.ts`).
3. `lib/load-site.ts` pide `GET /public/:slug/site[?preview=]` una vez por render (`cache` de React). Sin sitio → `notFound()`.

En producción `/_s/<slug>` solo se acepta con `?preview=` o si `SITES_ALLOW_SLUG_PATH=true`.

## Estructura

```
src/proxy.ts                 resolución del sitio
src/app/layout.tsx           html mínimo; el tema lo pone el layout de cada sitio
src/app/s/[site]/…           home, propiedades, propiedades/[id], contacto, nosotros,
                             sitemap.xml, robots.txt, api/contacto, loading, error, not-found
src/app/p/[site]/…           la vista previa: reexporta las páginas de /s con force-dynamic
src/templates/{classic,modern}/   Header, Footer, PropertyCard, PageTitle y las 9 secciones
src/templates/index.ts       el único mapa template → componentes
src/components/              ContactForm, SearchBar, ListingFilters, Gallery, MobileMenu, …
src/lib/                     api (server-only), theme, site-route, listing-query, format, whatsapp
```

**Un componente por sección por template**; el orden y la visibilidad vienen de `content.sections`. Las secciones sin contenido no se dibujan.

## Páginas

| Ruta                          | Render    | Notas                                                                            |
| ----------------------------- | --------- | -------------------------------------------------------------------------------- |
| `/`                           | ISR 60 s  | Secciones en el orden del editor; destacadas por `LATEST` o `MANUAL` (`ids=`)    |
| `/propiedades`                | dinámica  | Filtros por URL: operación, tipo, ubicación, precio, moneda, dormitorios, página |
| `/propiedades/[id]`           | ISR 60 s  | Galería, datos, descripción, comodidades, consulta, parecidas, JSON-LD           |
| `/contacto`, `/nosotros`      | ISR 60 s  | «Nosotros» solo si la sección es visible                                         |
| `/sitemap.xml`, `/robots.txt` | dinámicas | El borrador responde `Disallow: /`                                               |

SEO por página con `generateMetadata` desde `seo`, Open Graph, favicon del sitio, `noindex` en la vista previa y JSON-LD (`RealEstateAgent` y `RealEstateListing`).

## Seguridad

- **Cero `dangerouslySetInnerHTML`.** Todo lo que escribe la inmobiliaria se renderiza como texto de React (hay un test con `<img onerror>` y `<script>` en cada campo). El JSON-LD va como texto con `<` escapado.
- `next.config.ts`: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `COOP`; `frame-ancestors 'none'` salvo la vista previa (DT-121, DT-122). Sin `X-Powered-By`.
- El tema se revalida antes de llegar a un `style`; los links de WhatsApp y teléfono se arman solo con dígitos; las redes sociales ya llegan validadas (https y del dominio de la red).
- El formulario de contacto: honeypot `website`, validación de campos, comprobación de `Origin`, límite de tamaño, y reenvío server-side (DT-123).

## Accesibilidad y responsive

Mobile-first; probado a 375, 768 y 1280 px (capturas en `docs/capturas-web-inmobiliaria/`). Contraste AA por construcción (el texto de los botones se elige por luminancia; la publicación exige AA entre texto y fondos), targets ≥ 44 px, foco visible, `skip-link`, `prefers-reduced-motion` respetado, `alt` en todas las imágenes, estados de carga/vacío/error en español con voseo, `<details>` nativo para las preguntas.

## Desvíos y ampliaciones respecto de la spec

- El listado no es ISR sino dinámico (DT-117).
- La vista previa tiene su propio árbol `/p` (DT-116) en vez de leer `?preview` en las mismas páginas.
- Selector de ubicación como `<select>` (A-SITES-2).
- Ampliaciones aditivas de `public-listing.ts` (DT-126), que coinciden con las del backend.

## Cómo se probó

Ver el documento de PR (`docs/PR-web-inmobiliaria-sites.md`): `typecheck`, lint, formato y tests de todo el monorepo; Lighthouse móvil; auditoría de scroll horizontal, targets y `alt` a los tres anchos; pruebas manuales contra la API real (publicar, vista previa, contacto, aislamiento).

## Variables de entorno

| Variable                                                | Dónde      | Para qué                                                   |
| ------------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| `API_URL` (o `NEXT_PUBLIC_API_URL`)                     | sites      | URL de la API, con `/api/v1`                               |
| `SITES_PREVIEW_ANCESTORS`                               | sites      | Orígenes del backoffice que pueden embeber la vista previa |
| `SITES_ALLOW_SLUG_PATH`                                 | sites      | Habilita `/_s/<slug>` en producción                        |
| `SITES_IMAGE_SOURCES`                                   | sites      | Orígenes extra de imágenes (storage local en desarrollo)   |
| `NEXT_PUBLIC_SITES_URL`, `NEXT_PUBLIC_SITES_DNS_TARGET` | backoffice | URL de la app de sitios y destino del CNAME                |
| `SITES_BASE_DOMAIN` y compañía                          | backend    | Ver `docs/DECISIONES_TECNICAS.md` del backend (A-129)      |
