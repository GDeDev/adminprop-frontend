# Sitios web de las inmobiliarias — frontend (`apps/sites`, «Mi sitio web» y campos de propiedad)

Rama `feature/web-inmobiliaria-sites` → `dev`. Spec: `adminprop-repo-files/specs/web-inmobiliaria.md` (sesión B). Backend: `feature/web-inmobiliaria-api`.

> ⚠️ **Encadenado sobre `feature/fase-24-tasacion-automatica`** (y por ella sobre las Fases 23, 22, 25, 19, 15…). Se mergea después de esos PR, y de preferencia después del PR del backend. **Hecho sin supervisión.**

## Qué hace

1. **`apps/sites`** (puerto 3003): el sitio público de cada inmobiliaria, con los dos templates (`CLASSIC` y `MODERN`), resolución por host o por `/_s/<slug>`, ISR, SEO, listado con filtros, ficha, contacto, sitemap y robots.
2. **«Mi sitio web»** (`/sitio-web`, solo ADMIN) en el backoffice: estado, elección de template, pestañas Diseño / Contenido / Secciones / Dominio, vista previa en iframe con selector de ancho, guardar borrador, publicar y despublicar. _(Lo escribió un subagente; detalle en `docs/tecnica/web-inmobiliaria-backoffice.md`.)_
3. **Campos de propiedad** en el wizard (paso «Publicación») y la ficha: operación, precio y moneda, descripción pública, ambientes, dormitorios, baños, superficies y antigüedad.
4. `packages/shared-types/src/site.ts` **equivalente en contenido a la sección 5.1 de la spec (mismos tipos y campos; Prettier reformateó el bloque —sin punto y coma, otros espacios— y se agregó un comentario de cabecera)**, tipos regenerados desde el `openapi.json` real del backend y un chequeo de tipos que falla si la API deja de cumplir el contrato.

## Para revisar (lo más importante)

1. **DT-116** — La vista previa vive en su propio árbol `/p/…` (`force-dynamic`, reexporta las páginas). Un primer diseño con `?preview` en las mismas páginas rompía el ISR («Page changed from static to dynamic»); lo encontré probando contra la API real.
2. **DT-121 / DT-122** — CSP con `'unsafe-inline'` en `script-src` (costo de servir HTML cacheable) y `frame-ancestors 'none'` salvo la vista previa. **En producción hay que cargar `SITES_PREVIEW_ANCESTORS` con el origen del backoffice** o el iframe queda bloqueado.
3. **DT-117** — El listado es dinámico, no ISR (depende de la query). Home, ficha, contacto y «nosotros» sí son ISR.
4. **DT-123** — El formulario de contacto pasa por el propio sitio y reenvía la IP del visitante; requiere `TRUST_PROXY=true` en la API (A-142 del backend).
5. **DT-126** — Ampliaciones aditivas de `public-listing.ts` (`operation`, `rooms`, `coveredAreaM2`, `ageYears`; `operation`/`bedrooms`/`bathrooms`/`ids` en la query).
6. **DT-109 / DT-111 / DT-112** (backoffice) — Cambio de template con cambios sin guardar, aviso al salir (el botón «atrás» no se puede frenar con el App Router) y dominio propio con instrucciones DNS genéricas.
7. **Pendiente de Giuliano**: variables nuevas en Doppler (A-SITES-5) y, para la revalidación, `SITES_REVALIDATE_SECRET` en `sites` y `SITES_REVALIDATE_URL`/`SITES_REVALIDATE_SECRET` en el backend y `NEXT_PUBLIC_SITES_URL` / `NEXT_PUBLIC_SITES_DNS_TARGET` del backoffice; en el backend, `SITES_BASE_DOMAIN`.

## Desvíos respecto del contrato

- `site.ts` **sin desvíos de contenido** (es equivalente al bloque de la spec; ver arriba). La API es más estrecha que el contrato en `radius`, `template` y los `enum` (el chequeo es de un solo sentido a propósito).
- El listado no es ISR (DT-117); la vista previa usa `/p` en lugar de leer `?preview` en las mismas páginas (DT-116); selector de ubicación como `<select>` (A-SITES-2).
- Se arregló el typecheck de backoffice y portal que había dejado roto la regeneración de los tipos (fixtures sin campos nuevos de la API) y se agregó la etiqueta «Consulta nueva del sitio» para el aviso `PUBLIC_INQUIRY` (texto que inventó el subagente: revisarlo).

## Cómo se probó (resultados reales)

- `npm run typecheck`, `npm run lint` (`--max-warnings=0`) y `npm run format:check`: **verdes** en los 7 workspaces.
- `npm test`: **sites 62** (10 archivos), **backoffice 293** (52), **ui 39**, **portal 19**, **session 30**; todos en verde. En sites: proxy, rutas, tema, formato, filtros, formulario de contacto, JSON-LD y las nueve secciones de los dos templates (con un caso de XSS en cada campo de texto).
- **Contra la API real** (backend de la rama `feature/web-inmobiliaria-api` con Postgres, dos inmobiliarias de prueba con seis propiedades y fotos cada una, un template distinto en cada una): sitio público ISR (`x-nextjs-cache: HIT`, `s-maxage=60`), listado con filtros, ficha, sitemap, robots, publicar → se ve; borrador → **solo** se ve con el token; token inválido → 404; consulta del formulario → llega a la bandeja de la inmobiliaria correcta; otro `Origin` → 403; `/s` y `/p` directos → 404.
- **Lighthouse móvil** (build de producción, localhost, con la limitación de que las fotos las sirve el storage local sin CDN):

  | Página        | Performance | Accesibilidad | Prácticas | SEO |
  | ------------- | ----------- | ------------- | --------- | --- |
  | CLASSIC home  | 91          | 100           | 100       | 100 |
  | CLASSIC ficha | 97          | 100           | 100       | 100 |
  | MODERN home   | 94          | 100           | 100       | 100 |
  | MODERN ficha  | 96          | 100           | 100       | 100 |

- **Responsive**: capturas de home, listado y ficha de los dos templates a 375, 768 y 1280 px en `docs/capturas-web-inmobiliaria/`, y una auditoría automática (sin scroll horizontal, targets táctiles ≥ 44 px, `alt` en todas las imágenes, un solo `h1`) con **0 problemas** en 2 sitios × 3 anchos × 5 páginas.

## Segunda ronda: revisión de este PR (DT-127 a DT-133)

Hice una revisión del código de los dos PR y corregí lo encontrado:

| Hallazgo                                                             | Corrección                                                                                                                   |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Un 429 o 5xx de la API dejaba a un sitio real en 404 (y se cacheaba) | `UpstreamError`, 503 con `Retry-After`, último valor conocido, ISR conserva la última versión buena (DT-127)                 |
| La IP del visitante se podía falsificar con `X-Forwarded-For`        | `lib/client-ip.ts` (DT-128)                                                                                                  |
| El tema en un `div` dejaba el `html` blanco en sitios oscuros        | `:root` en un `<style>` + `theme-color` (DT-129)                                                                             |
| Publicar tardaba hasta ~2 min en verse                               | `POST /api/revalidate` + tags por sitio (DT-130); **verificado contra la API real: el título nuevo se ve apenas se publica** |
| Animación de aparición sin verificar con movimiento                  | Rango acotado y medido (DT-131)                                                                                              |
| Paginación sin números, rango de precio invertido, pedidos en serie  | DT-132                                                                                                                       |
| El backoffice no validaba el rol en la página                        | `AdminGate` (DT-133)                                                                                                         |
| Dominio propio sin verificación en el editor                         | Pestaña Dominio con el registro TXT (DT-133), contra el backend D-190                                                        |

Resultados: `typecheck`, `lint` y `format:check` verdes; tests **sites 73**, **backoffice 302**, ui 39, portal 19, session 30. Contra la API real: revalidación con secreto (401 sin él o con uno malo), tema en `:root`, `theme-color`, y las secciones llegan a opacidad 1 con movimiento activo a 375 y 1280 px.

**Sigue sin hacerse** (explicado en DT-133): favoritos, autoguardado, deshacer, recorte de imágenes, miniaturas reales y orden por precio.

## Revisión del PR (tercera ronda, DT-134 a DT-140)

| #   | Arreglo                                                                                                                                               | Dónde                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | `SocialLink` solo renderiza `https:`; los `mailto:` se validan en el render                                                                           | DT-134, tests con `javascript:`, `data:`, `http:` en los dos templates |
| 2   | `Origin: null` en el contacto es 403, no 500                                                                                                          | DT-135, test del route handler                                         |
| 3   | Hosts imposibles se descartan sin llamar a la API                                                                                                     | DT-136 (`host-policy.ts`), tests del proxy                             |
| 4   | Canonical + `og:url` en todas las páginas, `noindex` en listados filtrados o paginados, descripciones en contacto y nosotros, `lastmod` en el sitemap | DT-137 (dos commits)                                                   |
| 5   | La vista previa conserva el `theme-color`                                                                                                             | DT-138                                                                 |
| 6   | Precio de la ficha, «Precio a consultar», placeholder de fotos compacto                                                                               | DT-139; capturas regeneradas                                           |
| 7   | Ubicación: se queda el `<select>`                                                                                                                     | DT-140 (evaluado y anotado)                                            |
| 8   | «verbatim» corregido a «equivalente en contenido» (la única diferencia son los `;` de Prettier)                                                       | este PR, doc técnica y comentario de `site.ts`                         |
| 9   | Nota para quien integra (abajo)                                                                                                                       | PR                                                                     |
| 10  | Mejoras opcionales: **no hechas**                                                                                                                     | DT-140 / «Qué NO se hizo»                                              |

**Notas de integración (para quien mergea; no se tocó nada de esto):**

- **CSP del backoffice.** La rama `fix/front-security-audit` pone `frame-src 'self' about:` en la CSP del backoffice. Eso **bloqueará el iframe de la vista previa** del editor «Mi sitio web»: hay que agregar a `frame-src` el origen de `NEXT_PUBLIC_SITES_URL` (en desarrollo, `http://localhost:3003`). Del lado de `apps/sites` ya está resuelto con `frame-ancestors` para `SITES_PREVIEW_ANCESTORS` (el origen del backoffice).
- Las decisiones del backend se renumeraron a D-177..D-196 y A-137..A-148; los docs del frontend ya usan los nuevos números.

## Lo que NO pude verificar

- **El editor «Mi sitio web» en un navegador, logueado, contra la API real.** Solo está probado en jsdom con la API mockeada (25 tests de pantalla, 27 de helpers) y por typecheck. El responsive, el contraste y el foco del editor están cuidados por construcción pero no medidos.
- Que el iframe de la vista previa se embeba desde el backoffice real: probé que el sitio manda `frame-ancestors http://localhost:3001` con `?preview`, no el iframe en sí.
- Un dominio propio y un subdominio real (probé por `/_s/<slug>`; la resolución por host está cubierta por tests del proxy y por los e2e del backend).
- Lighthouse con CDN y fotos optimizadas, ni en producción.

## Después de mergear

`npm install` (se suma el workspace `apps/sites`, sin dependencias nuevas fuera del monorepo). Cargar las variables de A-SITES-5 y desplegar `apps/sites` con un comodín de subdominio (`*.<SITES_BASE_DOMAIN>`) hacia esa app.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01GhBUKJBqXbBFxfDrfiiXnz
