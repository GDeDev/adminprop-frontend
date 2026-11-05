# Integración del frontend 2 (`integration/frontend-2`)

Rama creada desde `origin/integration/frontend` (que ya traía Fase 24/23, `fix/front-security-audit`, `fix/front-design-responsive` y DT-140 a DT-142). Se mergearon, en este orden y con un merge commit por rama (`git merge --no-ff`), las ocho ramas pedidas. No se hizo push.

## Ramas mergeadas

| #   | Rama                                         | Commit                                                |
| --- | -------------------------------------------- | ----------------------------------------------------- |
| 1   | `origin/feature/web-inmobiliaria-v1-1-sites` | `merge: bring in feature/web-inmobiliaria-v1-1-sites` |
| 2   | `origin/fix/auditoria-seguridad-frontend`    | `merge: bring in fix/auditoria-seguridad-frontend`    |
| 3   | `origin/fix/auditoria-seguridad-2-frontend`  | `merge: bring in fix/auditoria-seguridad-2-frontend`  |
| 4   | `origin/fix/sites-resiliencia-api`           | `merge: bring in fix/sites-resiliencia-api`           |
| 5   | `origin/refactor/shared-types-generados`     | `merge: bring in refactor/shared-types-generados`     |
| 6   | `origin/feature/design-v2`                   | `merge: bring in feature/design-v2`                   |
| 7   | `origin/fix/visual-qa-design-v2`             | `merge: bring in fix/visual-qa-design-v2`             |
| 8   | `origin/feat/design-v2-adopcion`             | `merge: bring in feat/design-v2-adopcion`             |

Criterio general: el sistema de diseño es v2; los arreglos de comportamiento, seguridad y responsive del dueño (`fix/front-security-audit`, `fix/front-design-responsive`, DT-140 a DT-142) se conservan y se aplican en el lenguaje v2. Ante dos controles de seguridad equivalentes, gana el más estricto.

## Renumeración de decisiones (DT-xx)

La numeración chocaba entre ramas. Se renumeró lo de la rama que entra, a continuación de la última (DT-152 al llegar la sub-rama de sitios):

| Rama                                    | Original                                     | Nuevo                                                         |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| web-inmobiliaria-v1-1-sites (3.ª ronda) | DT-140 (ubicación: `<select>`)               | DT-150                                                        |
| web-inmobiliaria-v1-1-sites (v1.1)      | DT-141 (orden del listado)                   | DT-151                                                        |
| web-inmobiliaria-v1-1-sites (v1.1)      | DT-142 (ordenar por precio manda moneda)     | DT-152                                                        |
| fix/sites-resiliencia-api               | DT-150 (falla de API nunca se publica vacía) | DT-153                                                        |
| feature/design-v2                       | DT-107 a DT-111                              | DT-154 a DT-158 (107→154, 108→155, 109→156, 110→157, 111→158) |
| feat/design-v2-adopcion                 | DT-112 (v2 único sistema)                    | DT-159                                                        |

Quedan sin cambio: DT-140 a DT-142 de la integración (archivos privados con URL firmada, tipos `/auth`, CSP `frame-src`), DT-107 a DT-112 de las fases 23/24 y DT-143 a DT-149 de sitios v1.1. Se actualizaron las referencias en `docs/PR-web-inmobiliaria-sites.md`, `docs/tecnica/web-inmobiliaria-v1-1.md`, `docs/tecnica/web-inmobiliaria.md`, `docs/tecnica/design-v2.md`, `docs/PR-design-v2.md` y `CLAUDE.md`. Verificado: no quedan encabezados `### DT-nn` repetidos en `docs/DECISIONES_TECNICAS.md`.

## Conflictos y cómo se resolvieron

### 1. web-inmobiliaria-v1-1-sites

- `apps/backoffice/.env.example`: se conservaron las dos variables (`APP_ORIGINS` y `NEXT_PUBLIC_SITES_URL`).
- `turbo.json`: unión de las variables de `build.env`; se agregó `APP_ORIGINS` a la lista de sitios.
- `packages/shared-types/src/api.ts`: se conservaron los tipos de `/auth` (DT-141) y los alias de sitio.
- `packages/shared-types/src/generated/api.ts`: lado de la integración vacío salvo `areaM2` duplicado; se tomó el lado de sitios (agrega `operation`, `rooms`, `coveredAreaM2`, `ageYears`, filtros, `/site/*`).
- `docs/DECISIONES_TECNICAS.md`: se conservaron ambos bloques y se renumeró (ver arriba).
- `propiedades/property-form.tsx`: formulario de sitios (paso «Publicación» con operación, ambientes y superficies) con los imports y comportamientos de la integración (borrador por usuario, fotos grandes, `AppraisalSheet`). El botón «Sugerir precio» se movió al paso «Publicación» (`ListingStep` recibe `onSuggest`); la moneda usa el `Select` del sistema (cambio del dueño) en lugar del `<select>` nativo.
- `property-form.test.tsx`: versión de sitios; la moneda se elige con el `Select` (click + opción «Dólares (USD)»).
- `propiedades/[id]/property-detail.tsx` y `.test.tsx`: unión de imports; test de sitios.
- Arreglos posteriores (el merge automático dejó claves duplicadas): `settlement-detail.test.tsx` del portal (`pdfUrl`), `property-detail.test.tsx` (`listingPrice`, `listingCurrency`, `publicDescription`) y `lib/automations.ts` (`PUBLIC_INQUIRY`; se dejó «Consulta del portal», la de la integración).

### 2. fix/auditoria-seguridad-frontend vs `fix/front-security-audit` (dueño)

- `backoffice/src/proxy.ts`: regex del matcher equivalente; se dejó la de la integración. `proxy.test.ts`: la de la rama (más casos: assets, `/api`, `/login-historial`).
- `apps/portal/next.config.ts`: se conservan las cabeceras centrales de `config/security-headers.ts` (CSP completa, COOP, HSTS en producción), que son más estrictas que el `frame-ancestors 'none'` de la rama, y se suma `poweredByHeader: false` de la rama. `portal/src/security-headers.test.ts` se adaptó a las cabeceras centrales (la CSP contiene `frame-ancestors 'none'` y `object-src 'none'`; HSTS no aplica en test).
- `packages/session/src/client/api-client.ts` (`safeNextPath`): se conservó la versión de la integración (rechaza `\`, control, espacios; resuelve contra un origen y exige mismo origen y que `pathname` no empiece con `//` ni `/api/`). Se descartaron las constantes de la rama (quedaban sin uso). Test: el de la integración más el caso `/ok\u007f` de la rama.
- `configuracion/canales/channels-screen.tsx`: se conservó `safeHttpsUrl(authorizeUrl, ML_AUTH_HOSTS)` (https + lista de hosts de Mercado Libre) sobre `safeHttpUrl` de la rama.
- `crm/inquiry-card.tsx`: se conservó `openInNewTab` (abre la pestaña al click y valida la URL).
- Se eliminó `apps/backoffice/src/lib/safe-url.ts` (+ test) que traía la rama: duplicaba `@adminprop/ui/lib/safe-url`, que es un superconjunto.

Anotado: no hubo ningún control de la rama que fuera más estricto que el del dueño, salvo `poweredByHeader: false` y el caso `\u007f` en el test, ambos incorporados.

### 3. fix/auditoria-seguridad-2-frontend

- Borradores (`contratos/contract-form.tsx`, `propiedades/property-form.tsx`, `app/providers.tsx`): se combinaron los dos mecanismos. Se mantiene la clave por inmobiliaria y usuario (`lib/drafts.ts`, integración) y se usa `lib/form-draft.ts` de la rama para guardar (vence a las 8 h, omite notas/póliza y claves de aspecto sensible). Al cerrar sesión se llama a `clearDrafts()`; se dejó de llamar a `clearAllDrafts()` porque su patrón (`^adminprop:[a-z-]+-draft$`) no coincide con las claves con usuario.
- Enlaces a comprobantes (`cobros/[id]/installment-detail.tsx`, `contratos/[id]/advance-expenses-section.tsx`, `liquidaciones/[id]/settlement-detail.tsx`): se conservó `PrivateFileLink` (DT-140, URL firmada de 10 minutos) en lugar de los `<a>` con `safeHttpUrl` de la rama; `openInNewTab` ya valida http(s). Se quitó el test «no enlaza un comprobante cuya URL no es http(s)» (queda cubierto por `open-in-new-tab.test.ts`).
- `packages/session/src/server/session-routes.test.ts`: dos tests de proxy reverso usaban `mockResolvedValue` con una sola `Response`; como `start` ahora hace dos llamadas (`/auth/me` y `/tenants/current`) la segunda leía un cuerpo ya consumido. Se pasó a `mockImplementation`.

### 4. fix/sites-resiliencia-api

- `apps/sites/src/lib/api.ts`: el `fetch` lleva a la vez `headers: trustedServerHeaders()` (X-Sites-Secret, integración) y `signal` con timeout (rama).
- `apps/sites/src/lib/api.test.ts` (add/add): se dejó el de la rama y los tests de X-Sites-Secret de la integración pasaron a `api-secret.test.ts`.

### 5. refactor/shared-types-generados

- `backoffice/src/lib/contracts.ts`, `portal/src/lib/format.ts`: se dejó `formatMoney` re-exportado desde `@adminprop/ui/lib/format` (integración) y se eliminó `packages/ui/src/lib/format-money.ts` (+ test) de la rama, que era la misma función.
- `shared-types/src/api.ts`: se mantienen los tipos de respuesta de `/auth` (DT-141); se quitaron los alias `Site*Schema` (la rama deriva `site.ts` de `ApiSchemas`).
- `shared-types/src/site.ts` y `public-listing.ts`: versión de la rama (alias de `ApiSchemas`); se repuso `PublicListingSort` (lo usa `apps/sites`).
- **Edición manual de `generated/api.ts`** (ver «Tipos generados»): el archivo de la rama estaba generado con un OpenAPI sin `LUXURY` ni coordenadas públicas, que `apps/sites` v1.1 ya usa. Se agregó `"LUXURY"` a los cuatro enums de template y `latitude?`/`longitude?` a `PublicPropertyDetailDto`.

### 6. feature/design-v2

- `ui/checkbox.tsx`, `radio-group.tsx`, `switch.tsx`: clases v2 (`bg-card`, `hover:border-foreground/40`, `ring-ring/25`, transiciones acotadas) más el área táctil del dueño (`relative`, `after:-inset-*`, `md:after:hidden`).
- `portal/components/listing-filters.tsx`: campo v2 con los ajustes del dueño (`min-w-0`, `py-1`, `text-base md:h-9 md:text-sm`, opciones con fondo y texto del tema).
- `backoffice/components/app-shell.tsx`: rol del dueño (`visibleNavItems`) más paleta de comandos y `router` de v2; la paleta también filtra por rol (v2 la armaba con todos los ítems, lo que mostraba rutas de administrador a un empleado).
- `ui/components/accordion.tsx` (del dueño, sin conflicto): `transition-all` pasó a `transition-[color,box-shadow]` y `ring-ring/50` a `/25`, porque `design-rules.test.ts` de v2 prohíbe `transition-all`.
- `docs/DECISIONES_TECNICAS.md`: renumeración (ver arriba).

### 7. fix/visual-qa-design-v2

- `error.tsx` / `not-found.tsx` (backoffice y portal, add/add): se conservaron los del dueño (`ErrorState`, `PublicHeader`, texto «Volver al inicio»); se descartaron las variantes con `EmptyState` y el `console.error` de la rama.
- `portal/components/public-header.tsx`: logo y nombre del tenant (dueño) más `py-2.5` de la rama (área táctil).
- `ui/components/button.tsx`: versión de la rama (`xs` e `icon-xs` compactos con área táctil de 44 px mediante `after:`, más `loading`) en lugar del `h-11` en mobile que había puesto el dueño; los dos cumplen 44 px y `button.test.tsx` de la rama exige el seudo-elemento.
- `checkbox`, `radio-group`, `switch`: versión de la rama (token `border-control`, mismas áreas táctiles).
- `listing-filters.tsx`: extras responsive del dueño con `border-control`; se quitó `dark:border-muted-foreground/50` (el token ya se ve en oscuro).

### 8. feat/design-v2-adopcion

Regla: clases v2 (`shadow-raised`, `num`, escala `title-*`/`display-*`, `StatCard`) con el comportamiento y responsive del dueño.

- `entity-history.tsx`: enlace «Ver todo» al historial (dueño) con título y elevación v2.
- `(auth)/layout.tsx`: logo y nombre del tenant (dueño) con `text-display-md`.
- Paneles de ficha (`owner-settlements-section`, `services-section`, `credits-section`, `account-section`, `installments-section`, `advance-expenses-section`): `shadow-raised` y `lg:col-span-2` del dueño (en lugar de `md:`).
- `cobros/billing-screen.tsx`: se mantiene `PeriodInput` del dueño (sin la etiqueta de mes de v2) y `StatCard` de v2.
- `liquidaciones/consolidados/[id]/statement-detail.tsx`, `settlements-screen.tsx`: escala v2 y `num`, sin `capitalize` (el dueño ya lo había quitado).
- `propiedades/[id]/publication-section.tsx`: ambos imports (`StatCard` y `safeHttpUrl`).
- `contratos/[id]/terminate-dialog.tsx`: clases v2 con la etiqueta «Multa» del dueño (sin «(10 %)», que era un porcentaje fijo escrito en pantalla).
- `reportes/reports-screen.tsx`: aviso «Deslizá hacia el costado» y contenedor con scroll del dueño, `shadow-raised`; celdas numéricas con `text-right` más `num` / `font-display num`.
- Portal: `contact-form.tsx` («Enviá tu consulta»), `public-header.tsx`, `listing-filters.tsx` (`shadow-edge`), `app/page.tsx` y `propiedades/[id]/page.tsx` (siguen con `PriceText`, que ahora usa `num` y tamaños `text-title-*`), pantallas de pagos y cuenta (siguen con `periodTitle`, más `num`).
- `dashboard/mock-data-check.tsx`: el dueño lo había borrado; se mantuvo borrado.
- Después del merge, `ui/test/apps-v2-language.test.ts` marcó 26 líneas de pantallas que no pasaron por la adopción (`sitio-web/*`, `perfil/security-section.tsx`, `portal-security-screen.tsx`, `public-footer.tsx`): se pasaron de forma mecánica a `num`, escala con nombre y `shadow-raised`.
- `CLAUDE.md`: referencia a las decisiones de diseño actualizada a DT-154 a DT-159.

## CSP del backoffice

Sin cambios respecto de la integración: `frame-src 'self' about:` más el origen de `NEXT_PUBLIC_SITES_URL` (DT-142). `config/security-headers.ts` quedó idéntico a `origin/integration/frontend`, y `backoffice/next.config.ts` sigue pasando `sitesUrl`. Nada se debilitó; el portal usa la misma configuración central.

## Tipos generados (`generated/api.ts`)

> Actualizado en `integration/frontend-3`: ya se regeneró contra `integration/consolidado-2`; ver `docs/tecnica/shared-types-generados.md`.

En `integration/frontend-2` no se regeneró. El archivo está hecho contra el OpenAPI de la integración vieja del backend, con dos retoques manuales para que `apps/sites` v1.1 tipe (`LUXURY`, `latitude`/`longitude` públicos).

Cuando el backend nuevo (`integration/consolidado-2`) esté en GitHub:

1. `npm run api:types` (desde la raíz del monorepo; usa `../../../adminprop-backend/openapi.json`, así que ese repo tiene que estar en la rama nueva y con el `openapi.json` regenerado).
2. Revisar el diff de `packages/shared-types/src/generated/api.ts`: tienen que seguir estando `LUXURY` en `SiteTemplateKey`, `latitude`/`longitude` en `PublicPropertyDetailDto`, `operation`/`rooms`/`coveredAreaM2`/`ageYears` en el resumen público, los parámetros `operation`, `bedrooms`, `bathrooms`, `ids` del listado y las respuestas tipadas de `/auth/*` (`LoginResponse`, `PortalLoginResponse`, `RefreshResponse`, `MeResponse`).
3. `npm run typecheck`, `npm test` y revisar `no-manual-dto.test.ts`.

## Comandos corridos

Después de cada merge se corrió `npm run typecheck`, `npm run lint` (`--max-warnings=0`), `npm run format:check` y `npm test` (todos los workspaces, no solo los tocados). Resultado al cierre de cada uno: typecheck 7/7, lint 7/7, formato limpio y tests en verde, con estas excepciones:

- Merge 2 y 3: `site-screen.test.tsx > guardar borrador > está deshabilitado sin cambios y manda solo lo que cambió` falló una vez cada una bajo la carga de turbo (todos los workspaces en paralelo) y pasó al correrlo solo y con todo el backoffice. Parece de tiempo (timeout), no de lógica; no se tocó.
- Antes de resolver cada conflicto de la tanda hubo fallos que se arreglaron como se describe arriba (claves duplicadas, tests de portal/ui/session). Ninguno se silenció.

Estado final (`integration/frontend-2`, último merge):

| Comprobación            | Resultado                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `npm run typecheck`     | 7 de 7 workspaces OK                                                                   |
| `npm run lint`          | 7 de 7 OK, sin warnings                                                                |
| `npm run format:check`  | OK                                                                                     |
| `npm test`              | shared-types 3, session 45, sites 328, portal 23, ui 178, backoffice 339 (todos pasan) |
| `next build` backoffice | OK (`NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_SITES_URL` falsas)                            |
| `next build` portal     | OK (`NEXT_PUBLIC_API_URL`, `PORTAL_TENANT_SLUG` falsas)                                |
| `next build` sites      | OK (`API_URL`, `SITES_REVALIDATE_SECRET` falsas)                                       |

Los builds bajaron las tipografías de Google desde la sandbox sin problemas; sin Doppler ni secretos reales.

## No corrido

- `npm run api:types` (a propósito, ver arriba).
- E2E o pruebas contra una API real: no hay backend levantado; ningún flujo con red (login, sitios con datos, vista previa en iframe) se probó a mano.
- No se hizo push ni se abrió PR.
- No se pudo leer `docs/RETOMAR_2026-11-04_FORMATEO.md` ni `claude-memory/MEMORY.md` de `adminprop-repo-files` (la herramienta no deja correr git sobre otro checkout desde este worktree); se aplicaron las reglas del encargo (sin secretos, sin `--no-verify`, variables nuevas vacías) y los CLAUDE.md del repo.

## Qué revisar a mano

1. **Aspecto de v2 con los arreglos responsive del dueño**, en 375 px y escritorio: botones `xs`/`icon-xs` (ahora compactos con área táctil por seudo-elemento, no `h-11`), checkbox/radio/switch, filtros del portal, tablas de reportes (aviso de scroll), ficha de propiedad (paneles `lg:col-span-2`).
2. **Formulario de propiedad**: paso «Publicación» con «Sugerir precio» (solo editando), moneda con `Select`, borrador del alta (clave por usuario, vence a las 8 h, no guarda notas).
3. **Paleta de comandos** del backoffice con un usuario EMPLOYEE: no debe mostrar rutas de administrador.
4. **Tipos generados**: los dos retoques manuales (arriba) y el diff al regenerar.
5. **Textos que se tomaron del lado de la integración**: «Consulta del portal» (`PUBLIC_INQUIRY` en `automations.ts`; la rama de sitios decía «Consulta nueva del sitio»), «Multa» sin «(10 %)».
6. **Portal**: `PriceText` cambió de `text-xl` a `text-title-md` por defecto; comprobar tarjetas de listado y ficha.
7. El test flaky `site-screen.test.tsx` bajo carga (si molesta en CI, subir su timeout).
8. `apps/sites` no pasa por `apps-v2-language.test.ts` (solo escanea backoffice y portal); sus templates tienen su propio lenguaje visual.
