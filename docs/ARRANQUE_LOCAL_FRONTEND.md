# Arranque local del frontend (máquina recién formateada)

Guía para levantar `adminprop-frontend` (backoffice, portal y sitios) desde
cero, junto con el backend. Cada comando y cada variable se contrastó con los
`package.json` de la raíz y de las tres apps, `turbo.json`, los `next.config.ts`,
los `.env.example` y el código que lee `process.env`. Lo que no se pudo
verificar desde el sandbox figura como **a confirmar**.

> No existe `.env` y no se crea: las variables salen de Doppler (proyecto
> `admin-prop`). Los scripts `dev`, `build` y `start` de backoffice y portal ya
> corren dentro de `doppler run --`. **`apps/sites` no**: su script `dev` es
> `next dev --port 3003` a secas (ver sección 6).

## 1. Requisitos

| Qué               | Versión / nota                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js           | `engines.node >= 20` (`package.json` raíz). **No hay `.nvmrc` en este repo.** El CI usa Node 22 (`.github/workflows/ci.yml`) y el backend pide `>= 22`: usar **22** (se probó con 22.23.4) para no tener dos versiones. |
| npm               | `packageManager: npm@10.9.4` (viene con Node 22). El repo usa `package-lock.json`: instalar con `npm ci`.                                                                                                               |
| Git               | Para clonar.                                                                                                                                                                                                            |
| Docker            | Solo para el **backend** (Postgres 16 con `npm run docker:dev` en `adminprop-backend`). El frontend no usa Docker.                                                                                                      |
| Doppler CLI       | Para `dev`, `build` y `start` de backoffice y portal.                                                                                                                                                                   |
| `gh` (GitHub CLI) | Opcional: `gh auth login` para clonar por HTTPS y abrir PRs.                                                                                                                                                            |

## 2. Clonado (HTTPS)

```bash
gh auth login                 # una vez; elegir HTTPS
git clone https://github.com/GDeDev/adminprop-frontend.git
git clone https://github.com/GDeDev/adminprop-backend.git
git clone https://github.com/GDeDev/adminprop-repo-files.git   # specs y CLAUDE.md general
cd adminprop-frontend
git checkout dev              # o la rama de trabajo
```

Los tres repos se clonan **uno al lado del otro**: el `CLAUDE.md` del frontend
importa `../adminprop-repo-files/CLAUDE.md` y `npm run api:types` lee
`../adminprop-backend/openapi.json`. Son repos distintos: nunca se mezclan
cambios de ambos en un commit.

> La URL de `adminprop-repo-files` es una suposición por analogía con las otras
> dos: **a confirmar**.

## 3. Instalar

```bash
npm ci        # también instala el hook de pre-commit (Husky, vía "prepare")
```

Instalar con `npm ci` y no con `npm install` para respetar `package-lock.json`.

## 4. Doppler: login y mapeo de configs

```bash
doppler login        # una vez por máquina (abre el navegador)
```

Proyecto `admin-prop`. Mapeo **real** de configs:

| Carpeta                              | Config Doppler         | Estado                                                                   |
| ------------------------------------ | ---------------------- | ------------------------------------------------------------------------ |
| `adminprop-frontend/apps/backoffice` | `dev_backoffice`       | Confirmado.                                                              |
| `adminprop-frontend/apps/portal`     | `dev_portal`           | Confirmado.                                                              |
| `adminprop-backend` (raíz)           | `dev_backend`          | Confirmado.                                                              |
| `adminprop-frontend/apps/sites`      | `dev_sites` (sugerida) | Sin config confirmada: crearla (ver abajo). Hasta entonces, a confirmar. |

Vincular **cada carpeta** (el vínculo de Doppler es por directorio):

```bash
cd adminprop-frontend/apps/backoffice && doppler setup   # admin-prop / dev_backoffice
cd ../portal                          && doppler setup   # admin-prop / dev_portal
cd ../sites                           && doppler setup   # admin-prop / dev_sites (sugerida, ver abajo)
cd ../../../adminprop-backend         && doppler setup   # admin-prop / dev_backend
```

Para `apps/sites` no hay una config confirmada en Doppler; se sugiere crear
`dev_sites` (desde el panel: proyecto `admin-prop`, ambiente de desarrollo) antes
de correr `doppler setup` ahí. Sin config, `sites` igual corre pasando las
variables por la terminal (sección 6).

### Reglas del dueño para las variables

- **Nunca** un archivo `.env` con valores reales. Los `.env.example` de las apps
  son solo documentación.
- Una variable nueva se crea **vacía** en la config que corresponda:

  ```bash
  doppler secrets set NOMBRE="" --project admin-prop --config dev_backoffice
  ```

  y el valor lo carga el dueño después. Config según la app: `dev_backoffice`,
  `dev_portal`, `dev_sites` (sugerida) o `dev_backend` (las variables nuevas del
  backend también se crean vacías; el backend, tras su arreglo de arranque, trata
  una variable vacía como no definida).

- `NEXT_PUBLIC_*` **solo para valores no sensibles**: terminan en el bundle del
  navegador. Los secretos, solo en variables sin ese prefijo (Server Actions,
  route handlers o servidor).
- `build` no se cachea en turbo (`cache: false`): las variables entran por
  Doppler dentro del script y turbo no las ve, así que un caché podría servir un
  bundle con una `NEXT_PUBLIC_API_URL` vieja.

### CORS en el backend (obligatorio)

El navegador llama a la API directo desde el backoffice (`http://localhost:3001`)
y el portal (`http://localhost:3002`); los puertos salen de los scripts
`dev`/`start` de `apps/backoffice/package.json` y `apps/portal/package.json`. El
backend deja CORS cerrado si no tiene `CORS_ORIGINS`, así que **en `dev_backend`
tiene que existir**:

```bash
doppler secrets set CORS_ORIGINS="http://localhost:3001,http://localhost:3002" --project admin-prop --config dev_backend
```

Sin esto ni el login del backoffice entra: la consola del navegador muestra un
error de CORS (`blocked by CORS policy: No 'Access-Control-Allow-Origin' header`)
y la petición a `/auth/login` falla. Hay que reiniciar el backend después de
cargarla. (Es una variable del backend, no de las apps de este repo; `apps/sites`
llama a la API desde el servidor y no la necesita.)

## 5. Variables por app

Sin valores. "Dónde se lee" es el archivo que lo usa; si un nombre figura solo en
`turbo.json` se aclara. Los `.env.example` documentan las de backoffice y portal;
`apps/sites` no tiene `.env.example`.

### Backoffice (`dev_backoffice`)

| Variable                       | Obligatoria | Qué es / dónde se lee                                                                                                                                                                                                                      |
| ------------------------------ | :---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`          |     Sí      | URL base de la API, con el prefijo `/api/v1`. `src/lib/api-client.ts`, `src/lib/session-routes.ts`, `next.config.ts` (la CSP `connect-src`). No sensible.                                                                                  |
| `NEXT_PUBLIC_SITES_URL`        |     No      | URL de `apps/sites`: la vista previa de «Mi sitio web» arma el iframe con ella (`src/lib/site.ts`) y la CSP `frame-src` la incluye (`next.config.ts`). Sin definir, el código usa un valor por defecto de desarrollo para `apps/sites`.    |
| `NEXT_PUBLIC_SITES_DNS_TARGET` |     No      | Destino del CNAME que se muestra al cargar un dominio propio (`sitio-web/domain-tab.tsx`). Lo define cada despliegue. No sensible.                                                                                                         |
| `APP_ORIGINS`                  |     No      | Orígenes públicos de la app, separados por coma, cuando corre detrás de un proxy que no manda `X-Forwarded-Host`/`-Proto` (`packages/session/src/server/session-routes.ts`). Sirve para validar el origen en los route handlers de sesión. |

### Portal (`dev_portal`)

| Variable              |     Obligatoria     | Qué es / dónde se lee                                                                                                                                                                                              |
| --------------------- | :-----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` |         Sí          | Igual que en el backoffice (`src/lib/api-client.ts`, `public-api.ts`, `tenant-branding.ts`, `session-routes.ts`, `next.config.ts`).                                                                                |
| `PORTAL_TENANT_SLUG`  | Sí (en la práctica) | Slug de la inmobiliaria dueña de este portal (`src/lib/tenant-branding.ts`). Sin valor, el login del portal avisa que no hay inmobiliaria configurada. Debe existir en la API (el seed de desarrollo crea `demo`). |
| `APP_ORIGINS`         |         No          | Igual que en el backoffice.                                                                                                                                                                                        |

### Sitios (`apps/sites`, config `dev_sites` sugerida)

| Variable                     |     Obligatoria     | Qué es / dónde se lee                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | :-----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `API_URL`                    | Sí (o la siguiente) | URL base de la API con `/api/v1`, solo servidor (`src/lib/api.ts`). Tiene prioridad sobre `NEXT_PUBLIC_API_URL`. Sin ninguna de las dos, la app no puede pedir nada a la API.                                                                                                                                                                                                                                                                                                                                                              |
| `NEXT_PUBLIC_API_URL`        |     Alternativa     | Respaldo de `API_URL` (`src/lib/api.ts`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `API_TIMEOUT_MS`             |         No          | Timeout en milisegundos de las llamadas a la API (`src/lib/api.ts`); por defecto 8000.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `SITES_SERVER_SECRET`        |    No (secreto)     | Secreto que `apps/sites` manda a la API como header `X-Sites-Secret` en las lecturas del servidor (`src/lib/api.ts`); con él la API no cuenta esas lecturas contra el tope por IP. Se lee primero esta; si falta, se usa `SITES_REVALIDATE_SECRET`. La API acepta su propio `SITES_SERVER_SECRET` o `SITES_REVALIDATE_SECRET` (el que coincida). Solo servidor: nunca `NEXT_PUBLIC_`. Sin ninguno, no se manda el header y las lecturas quedan limitadas por IP.                                                                           |
| `SITES_REVALIDATE_SECRET`    |    No (secreto)     | Prende el endpoint `POST /api/revalidate` (sin él responde 404), que la API llama con `Authorization: Bearer` (`src/app/api/revalidate/route.ts`). También es el respaldo de `SITES_SERVER_SECRET` para el header `X-Sites-Secret`. Solo servidor: nunca `NEXT_PUBLIC_`.                                                                                                                                                                                                                                                                   |
| `SITES_BASE_DOMAIN`          |         No          | Dominio base de los subdominios `<sub>.<dominio>` (`src/lib/host-policy.ts`). Sin valor, solo se resuelven dominios propios y el acceso por slug.                                                                                                                                                                                                                                                                                                                                                                                          |
| `SITES_PROTOCOL`             |         No          | `http` o, por defecto, `https`; arma el canonical (`src/lib/site-route.ts`).                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `SITES_TRUST_FORWARDED_HOST` |         No          | `true` para confiar en `X-Forwarded-Host` (solo detrás de un proxy propio que lo fija) (`src/lib/request-host.ts`). Por defecto vale `Host`.                                                                                                                                                                                                                                                                                                                                                                                               |
| `SITES_ALLOW_SLUG_PATH`      |         No          | `true` habilita en producción el acceso `/_s/<slug>` (en desarrollo siempre está habilitado) (`src/proxy.ts`).                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `SITES_PREVIEW_ANCESTORS`    |         No          | Orígenes del backoffice que pueden embeber la vista previa en un iframe; en desarrollo vale `http://localhost:3001 http://127.0.0.1:3001` (`next.config.ts`). En producción, sin valor, ninguno.                                                                                                                                                                                                                                                                                                                                           |
| `SITES_IMAGE_SOURCES`        |         No          | Orígenes extra de imágenes para la CSP (`img-src`), separados por espacio o coma; en desarrollo incluye el almacenamiento local del backend (`next.config.ts`).                                                                                                                                                                                                                                                                                                                                                                            |
| `SITES_CLIENT_IP_HEADER`     |         No          | Header que trae la IP real del visitante y que fija la plataforma de despliegue (`x-real-ip`, `cf-connecting-ip`, `x-vercel-forwarded-for`…). La lee `src/lib/client-ip.ts` para pasarle a la API la IP de quien envía el formulario de contacto (`src/app/s/[site]/api/contacto/route.ts`), de modo que el límite de envíos sea por visitante. Si falta, se usa `X-Forwarded-For` contando desde la derecha (ver la siguiente). Solo poner un header que el proxy garantice: cualquiera puede escribir los demás. En local no hace falta. |
| `SITES_TRUSTED_PROXY_HOPS`   |         No          | Cuántos proxies propios hay delante de la app (por defecto 1). `client-ip.ts` toma de `X-Forwarded-For` el valor que agregó el proxy más cercano, contando desde la derecha; el primer valor lo escribe el cliente y no se usa. Se ignora si hay `SITES_CLIENT_IP_HEADER`. Si ambas faltan no pasa nada grave: rige el valor 1, y si no hay una IP válida el formulario se envía igual y la API cuenta por la IP del servidor, es decir, el límite pasa a ser compartido por todos los visitantes. En local no hace falta.                 |

## 6. Puertos, comandos y URLs

Puertos (de los scripts `dev`/`start`): API (backend) **3000**, backoffice
**3001**, portal **3002**, sitios **3003**.

Orden de arranque:

1. **Backend primero** (`adminprop-backend`, ver su guía
   `docs/ARRANQUE_LOCAL_BACKEND.md`): `npm run docker:dev`, `npm run
prisma:migrate`, el seed o `tenant:create`, y `npm run start:dev`. Sin la API
   arriba, el login y casi todas las pantallas fallan.
2. Frontend, desde `adminprop-frontend`:

```bash
npm run dev                                      # turbo: levanta las apps que tienen script dev
npx turbo run dev --filter=@adminprop/backoffice # o una sola app
npx turbo run dev --filter=@adminprop/portal
```

`apps/sites` se levanta aparte porque su script no usa Doppler:

```bash
# con Doppler (si ya existe y está vinculada la config de sitios)
cd apps/sites && doppler run -- npm run dev
# sin Doppler, pasando las variables a mano
API_URL=<url de la API con /api/v1> npm run dev -w @adminprop/sites
```

> `npm run dev` en la raíz ejecuta `turbo run dev`, que corre el script `dev` de
> **las tres** apps, incluida `sites`; ahí `sites` arranca sin Doppler y sin
> `API_URL`, así que no podrá consultar la API. Para trabajar con sitios usar el
> comando de arriba.

URLs:

| App        | URL                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| API        | `http://localhost:3000/api/v1` (Swagger: `http://localhost:3000/swagger`)                                    |
| Backoffice | `http://localhost:3001` (login en `/login`); vitrina del sistema de diseño en `/design-system` (solo en dev) |
| Portal     | `http://localhost:3002`                                                                                      |
| Sitios     | `http://localhost:3003/_s/<slug>` (acceso por slug de desarrollo)                                            |

Otros comandos (raíz): `npm run lint` (falla con cualquier warning),
`npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`.
`npm run api:types` regenera `packages/shared-types/src/generated/api.ts` desde
`../adminprop-backend/openapi.json` (el backend tiene que estar en la rama
correcta y haber corrido `npm run openapi:export`).

## 7. Primer login

- **Con el seed de desarrollo del backend** (`npm run prisma:seed`): inmobiliaria
  `demo` y usuario `admin@demo.local` / `demo-admin-1234` (credenciales solo de
  desarrollo, según la guía del backend; el seed se niega a correr en
  producción). Para el portal, `PORTAL_TENANT_SLUG` debe ser `demo`.
- **Con una inmobiliaria real** (`npm run tenant:create` en el backend): la
  contraseña del administrador se genera y se muestra **una sola vez** en la
  terminal. Después, `PORTAL_TENANT_SLUG` debe ser el slug usado.
- Backoffice: abrir `http://localhost:3001/login`. Los usuarios del portal
  (propietario, inquilino) los crea un administrador desde el backoffice.

## 8. Problemas conocidos

- **Symlinks y Turbopack**: Next 16 con Turbopack falla si `node_modules` (o una
  dependencia del workspace) es un symlink que apunta fuera de la raíz del
  proyecto. En una instalación normal (`npm ci`) no pasa. Si se arma el árbol con
  enlaces para ahorrar espacio, usar hard links (`cp -al`), no symlinks.
  **A confirmar** en tu máquina.
- **Test inestable**: `site-screen.test.tsx > guardar borrador > está
deshabilitado sin cambios y manda solo lo que cambió` falló alguna vez bajo la
  carga de turbo (todas las suites en paralelo) y pasa solo o con el resto del
  backoffice. Parece de tiempo, no de lógica (ver
  `docs/INTEGRACION_FRONTEND_2.md`).
- **`next typegen`**: `npm run typecheck` lo corre antes de `tsc`. Un `tsc`
  suelto en una app protestará por `PageProps` hasta que existan los tipos de
  rutas generados.
- **El login del backoffice no entra y la consola del navegador muestra un error
  de CORS** (`Access to fetch at 'http://localhost:3000/api/v1/...' from origin
'http://localhost:3001' has been blocked by CORS policy`): falta
  `CORS_ORIGINS` en `dev_backend` (el backend deja CORS cerrado si no está). Ver
  «CORS en el backend» en la sección 4. Si además falla `NEXT_PUBLIC_API_URL`,
  debe apuntar a la API local con `/api/v1`.
- **El portal dice «no hay inmobiliaria configurada»**: falta
  `PORTAL_TENANT_SLUG` en `dev_portal`, o el slug no existe en la API.
- **«Mi sitio web»: la vista previa no se ve**: `apps/sites` no está levantada,
  `NEXT_PUBLIC_SITES_URL` no apunta a ella o `SITES_PREVIEW_ANCESTORS` no incluye
  el origen del backoffice (en desarrollo ya lo incluye).
- **`doppler: command not found` o «You must specify a project»**: instalar el
  CLI y correr `doppler login` + `doppler setup` en la carpeta de la app.
- **El pre-commit falla**: corre Prettier, ESLint (`--max-warnings=0`) y
  `vitest related`; arreglar el error, no saltearlo con `--no-verify`.

## 9. Qué no se verificó

- Ninguno de estos comandos se corrió con Doppler real ni contra el backend en
  una máquina limpia: la guía se contrastó contra `package.json`, `turbo.json`,
  los `next.config.ts`, los `.env.example` y el código.
- Que exista la config `dev_sites` en Doppler (es una sugerencia), la URL del
  repositorio `adminprop-repo-files` y el problema de symlinks con Turbopack en
  tu máquina siguen **a confirmar**.

Ya confirmado (y fuera de «a confirmar»): el mapeo de configs
`dev_backoffice` / `dev_portal` / `dev_backend`; que `SITES_CLIENT_IP_HEADER` y
`SITES_TRUSTED_PROXY_HOPS` las lee `apps/sites` (`client-ip.ts`); que
`CORS_ORIGINS` es obligatoria en `dev_backend`; y que el secreto de sitios es
`SITES_SERVER_SECRET` o, de respaldo, `SITES_REVALIDATE_SECRET` (DT-166).
