# Decisiones Técnicas

> Registro de ambigüedades técnicas que las specs no cubrían, qué se decidió y por qué (ver `CLAUDE.md`, "Qué hacer ante una ambigüedad técnica").

---

## Scaffold de frontend (2026-09-18)

Base técnica de `apps/backoffice`, `apps/portal` y `packages/*`, armada en paralelo al backend a partir de `extras/PROMPT_scaffold_frontend.md`. No cierra ninguna fase: adelanta la parte frontend de la Fase 3 (sección 2.4 a 2.6).

### DT-01 — Gestor de paquetes: npm workspaces

- **Ambigüedad:** la spec pide Turborepo pero no fija el gestor de paquetes.
- **Decisión:** npm workspaces (`packageManager: npm@10.9.4`).
- **Por qué:** pnpm no estaba instalado y habilitarlo con corepack toca la instalación global de Node. Turborepo funciona igual con npm. Migrar a pnpm después es barato (cambiar `workspaces` por `pnpm-workspace.yaml` y `"*"` por `"workspace:*"`).

### DT-02 — Estructura de `packages/ui`: plantilla oficial de shadcn para monorepo

> Fase 3: el estilo pasó de `radix-nova` a `new-york`, como pide `ADMINPROP-UI.md` (ver DT-15). La estructura sigue igual.

- **Decisión:** la estructura sale de `shadcn init --monorepo` (estilo `radix-nova`, Radix UI, Tailwind v4 con configuración en CSS y sin `tailwind.config`). Los componentes se consumen como `@adminprop/ui/components/<nombre>`, sin barrel file.
- Los paquetes internos son JIT (se publica el código TypeScript fuente, sin paso de build): cada app los transpila con `transpilePackages`.
- Se agregan componentes nuevos desde `packages/ui`: `npx shadcn@latest add <componente>`.

### DT-03 — `form` de shadcn → `field` + `Controller`

- **Ambigüedad:** el pedido menciona el componente `form`. En la versión actual del registry (shadcn 4.x, estilo `radix-nova`) `form` existe pero viene **vacío**: está deprecado.
- **Decisión:** se usa `field` (`Field`, `FieldLabel`, `FieldError`, `FieldGroup`…) con `Controller` de React Hook Form y `zodResolver`, que es la integración que documenta shadcn hoy. Ejemplo funcionando: `apps/backoffice/src/app/(auth)/login/login-form.tsx`.

### DT-04 — Tokens de color

> **Reemplazada en la Fase 3 (DT-14).** Los tokens ahora son los del sistema de diseño (`packages/ui/src/styles/adminprop.css`), con modo oscuro. `theme.css` y los tokens `nav-*` se borraron. Queda como registro del scaffold.

- Los hex viven **solo** en `packages/ui/src/styles/theme.css`. Todo lo demás usa clases semánticas.
- `--color-primary` = Dark Green, `--color-accent` = Copper, `--color-neutral-bg` = Off-White, `--color-neutral-dark` = Nero, `--color-nav*` = navegación sobre Nero.
- **Efecto colateral:** shadcn usa `accent` para los ítems resaltados de menús y selects, así que esos ítems toman el Copper. Se acepta porque es coherente con la marca; si Claude Design (Fase 2) lo quiere distinto, se separa en un token `--highlight`.
- `--success`, `--warning` y `--danger` son colores funcionales provisorios (no están en la paleta del PRD) hasta el sistema de diseño de la Fase 2.
- Slot por tenant: sobreescribir `--brand-primary`. Los neutros y la tipografía son fijos.
- Se quitó el modo oscuro de la plantilla de shadcn (no está en el PRD).

### DT-05 — Tipografía

> **Reemplazada en la Fase 3:** Outfit (`font-display`) + Figtree (`font-sans`), según `ADMINPROP-UI.md`.

- Fraunces (serif: títulos y precios) + Inter (sans: cuerpo e interfaz), cargadas con `next/font` en cada app y expuestas como `font-serif`/`font-heading` y `font-sans`.

### DT-06 — Cliente HTTP y TanStack Query duplicados por app (no en `shared-utils`)

- **Decisión:** `src/lib/api-client.ts` + `src/app/providers.tsx` viven en cada app.
- **Por qué:** `packages/shared-utils` (Fase 1) es para helpers puros que también consume `apps/api` (dinero, fechas); meter Axios y React ahí lo acopla al navegador. Además, cada app redirige distinto ante un 401: el backoffice va a `/login` y el portal va al login del área (`/propietario/login` o `/inquilino/login`). Son ~40 líneas por app; si crecen, se extraen a un `packages/api-client`.
- Access token en memoria (Fase 4, sección 6). El refresh silencioso queda como `TODO(Fase 4)`.

### DT-07 — Mocks en `packages/mocks`

- Fixtures descartables compartidos por las dos apps, tipados con `@adminprop/shared-types`. Hay 9 propiedades, 6 propietarios, 7 inquilinos, 4 garantes y 6 contratos, más los maestros y un tenant de demo genérico.
- Los datos son coherentes entre sí: las propiedades alquiladas tienen su contrato activo y su inquilino, y hay casos borde de las specs (propiedad sin fotos, propiedad sin propietario, póliza vencida, contrato por vencer, contrato en USD, garante con dos contratos, propietario con 3+ contratos activos).
- `withLatency()` simula red para ver los skeletons.

### DT-08 — Idioma: nombres de código en inglés, URLs en español

- Tipos y valores de enums en inglés (`PropertyStatus = "available" | "rented" | "under_maintenance"`), aunque los DTOs de ejemplo de las specs usan valores en español (`"disponible"`). **A confirmar al implementar la API:** que los enums del contrato HTTP también sean en inglés, para que front y back coincidan.
- Inquilino = `Renter` (no `Tenant`, que es la inmobiliaria).
- Los segmentos de URL quedan en español (`/propiedades`, `/propietario/login`) porque son texto visible para el usuario y así los definen las specs.

### DT-09 — Puertos de desarrollo

- `apps/api` → 3000 (default de NestJS), `apps/backoffice` → 3001, `apps/portal` → 3002.

### DT-10 — Bottom sheet

> **Reemplazada en la Fase 3:** `BottomSheet` se borró. `ADMINPROP-UI.md` pide `Drawer` (vaul) en mobile; para lo que en desktop es un diálogo está `ResponsiveDialog` (DT-17).

- `@adminprop/ui/components/bottom-sheet` está construido sobre `Dialog`, como se pidió: en mobile se ancla abajo y desde `sm` se ve como dialog centrado. No tiene gesto de arrastrar para cerrar. Si el diseño de la Fase 2 lo pide, evaluar `drawer` de shadcn (vaul).

---

## Dos repos en vez de un monorepo (2026-09-18)

La Fase 1 describe un único monorepo (`apps/api` + `apps/backoffice` + `packages/shared-utils` + `packages/shared-types`). El proyecto quedó partido en dos repos independientes (`adminprop-backend` y `adminprop-frontend`), así que el código compartido entre API y web se resolvió así:

### DT-11 — Dinero: se calcula solo en la API

- **Ambigüedad:** la spec pone `money.ts` en `packages/shared-utils`, consumido por API y web. Con dos repos no hay workspace común.
- **Decisión:** toda la aritmética de dinero (`decimal.js`, `ROUND_HALF_UP`) vive en la API. El frontend recibe los montos como string y solo los formatea para mostrar; nunca suma, resta ni calcula porcentajes.
- **Por qué:** una sola implementación del redondeo evita diferencias de centavos entre lo que muestra la pantalla y lo que persiste la base.

### DT-12 — Tipos del contrato HTTP: generados desde el OpenAPI de la API

- **Decisión:** los tipos de request/response se generan a partir del OpenAPI que expone la API (Swagger), módulo a módulo, a medida que cada endpoint existe. `packages/shared-types` queda para tipos propios del frontend y como puente mientras un módulo siga con mocks.
- **Por qué:** mantener tipos a mano en dos repos se desincroniza; el OpenAPI es el contrato real. La herramienta de generación se elige al conectar el primer módulo real.

### DT-13 — Documentación: fuente única en `adminprop-repo-files`

- PRD, specs, roadmap y sistema de diseño viven solo en `../adminprop-repo-files/`. Se borraron las copias de este repo (estaban desactualizadas: les faltaba la sección del sistema de diseño).
- `CLAUDE.md` de este repo importa el general. Acá quedan solo `docs/tecnica/`, `docs/funcional/` y este archivo.

---

## Fase 3 — Setup (2026-09-19)

Detalle en [`tecnica/fase-03.md`](tecnica/fase-03.md).

### DT-14 — Tokens: copia textual del sistema de diseño

- **Decisión:** `packages-ui-source/globals.css` se copia **sin tocar** a `packages/ui/src/styles/adminprop.css`. Lo propio del monorepo (`@source`, `tw-animate-css`, fuente de los títulos) va en `globals.css`, que importa el anterior. Prettier ignora la copia.
- **Por qué:** la spec pide copiarlo "tal cual". Así, actualizar el sistema de diseño es reemplazar un archivo, y el diff contra la fuente es cero.
- **Nota:** el `@theme inline` del original declara `--radius-sm: var(--radius-sm)` (se referencia a sí mismo). Funciona porque el `:root` del mismo archivo está fuera de `@layer` y le gana a la variable que Tailwind emite en `@layer theme` (verificado en el CSS compilado). Las sombras `--shadow-*` del sistema de diseño no pisan las utilidades `shadow-*` de Tailwind: si hacen falta, usar `shadow-(--shadow-md)`.

### DT-15 — shadcn `new-york` y ajustes post-instalación

- **Decisión:** estilo `new-york` (lo pide `ADMINPROP-UI.md`; el scaffold usaba `radix-nova`). Se reinstalaron los componentes existentes para que todo el set sea del mismo estilo.
- Ajustes aplicados a todo lo instalado:
  - `accent` → `muted` en hover, foco y selección;
  - `text-white` → `text-destructive-foreground`;
  - sin `dark:bg-destructive/60`;
  - `Calendar` en español.
- **Área táctil de 44px:** `Button` (default, lg, icon), `Input` y `SelectTrigger` miden `h-11` en mobile y vuelven al tamaño de shadcn desde `md:`. Los tamaños `sm` y `xs` quedan chicos: son para contextos densos de desktop.
- `test/design-rules.test.ts` hace cumplir estas reglas en cada `shadcn add` futuro.

### DT-16 — Navegación en `packages/ui` sin depender de Next

- **Decisión:** `AppSidebar` y `BottomNav` reciben `pathname` y `linkComponent`, y las apps les pasan `usePathname()` y `next/link`.
- **Por qué:** el paquete de UI queda testeable con Vitest sin el router de Next.
- **Máximo 5 destinos en `BottomNav`:** el resto va en `more` ("Más" + Drawer). En desarrollo hay un `console.warn` si se pasan más.

### DT-17 — `ResponsiveDialog` para "Mobile = Drawer"

- **Decisión:** un componente con la API de `Dialog` que, según `useIsDesktop()` (`min-width: 48rem`, el `md` de Tailwind), renderiza `Drawer` o `Dialog`.
- En el server y en el primer render del cliente se asume mobile. No causa saltos porque el diálogo arranca cerrado.
- Usarlo para todo lo que el usuario abre desde una pantalla. `Dialog` y `Drawer` directos solo si el caso es explícitamente de un solo tamaño.

### DT-18 — Tema por inmobiliaria

- **Decisión:** `tenantThemeStyle(Tenant.primaryColor)` en el `style` del `<html>`, desde el root layout de cada app (server).
- Solo acepta `#rgb` / `#rrggbb`. Cualquier otra cosa se ignora: el valor viene de la base y va a un `style`.
- `--primary-foreground` se calcula por contraste WCAG y usa `var(--sidebar-foreground)` o `var(--sidebar)`, que son claro y oscuro en los dos modos. Así el helper no escribe hex.
- **Limitación conocida:** el `style` inline pisa `--primary` también en modo oscuro, donde el sistema de diseño usa un azul más claro. Una inmobiliaria con un color muy oscuro puede verse con poco contraste en modo oscuro. Si pasa, se agrega un segundo color (`primaryColorDark`) en `Tenant`.

### DT-19 — Tests con Vitest

- **Decisión:** Vitest 5 + Testing Library + jsdom, con un `vitest.config.ts` por workspace (alias `@/` y `@adminprop/ui/*`), en lugar de Jest.
- **Por qué:** es ESM nativo y usa el mismo pipeline de Vite para TSX. Jest necesitaría configurar transformaciones para los paquetes JIT.
- `test/setup.ts` de `packages/ui` stubea `window.matchMedia` (jsdom no lo implementa): por defecto, viewport mobile.

### DT-20 — Lint estricto y pre-commit

- `eslint-plugin-only-warn` (del template de Turborepo) convierte todas las reglas en warning. Por eso `lint` corre con `--max-warnings=0`; si no, nunca fallaba.
- lint-staged corre ESLint desde la raíz con `--flag v10_config_lookup_from_file`, así cada archivo usa el `eslint.config.js` de su workspace. Hay un `eslint.config.mjs` en la raíz solo para los archivos de configuración.
- El formato se **corrige** en el pre-commit (`prettier --write`) en vez de rechazar el commit, igual que en el backend. El CI sí rechaza (`format:check`).

### DT-21 — `AGENTS.md` / `CLAUDE.md` que genera `next dev`

- Next 16 crea `apps/<app>/AGENTS.md` (y un `CLAUDE.md` que lo importa) al correr `next dev`, y los vuelve a crear si se borran. Se commitean para que el árbol quede limpio.
- **Qué dicen:** que la versión de Next tiene cambios incompatibles y que hay que consultar `node_modules/next/dist/docs/`.

### DT-22 — Vitrina `/design-system`

- Página del backoffice **solo de desarrollo** (`notFound()` si `NODE_ENV === "production"`) para revisar tokens, modo oscuro, componentes y el tema por inmobiliaria.
- No es una herramienta de producto: no se enlaza desde la navegación.

---

## Fase 4 — Auth y usuarios

> Hecha **sin supervisión**, con autorización de Giuliano: estas decisiones están pendientes de revisión.

### DT-23 — Tipos del contrato generados y commiteados

- **Decisión:** `npm run api:types` corre `openapi-typescript` sobre `../adminprop-backend/openapi.json` y escribe `packages/shared-types/src/generated/api.ts`. El archivo se commitea; ESLint lo ignora.
- **Por qué:** el CI del frontend no tiene el backend al lado. Commitearlo hace que cada cambio de contrato se vea en el diff. El backend garantiza en su CI que `openapi.json` esté al día.
- Los roles pasan a los valores de la API (`ADMIN`, `EMPLOYEE`, `OWNER`, `RENTER`). `PortalRole` (`owner` | `renter`) queda como el área del portal en la URL.
- **Limitación:** las respuestas de un solo objeto del OpenAPI no documentan el sobre `{ success, message, data }`, así que se tipan como `ApiSuccess<T>` a mano (D-24 del backend).

### DT-24 — Paquete `@adminprop/session`

- **Decisión:** todo lo de sesión vive en un paquete compartido, con dos entradas: `/server` (route handlers, cookies) y `/client` (token en memoria, `createApiClient`, `SessionProvider`, `ProtectedRoute`, helpers de errores de la API). Cada app sólo lo configura: prefijo de cookies y rutas de login.
- **Por qué:** backoffice y portal necesitan exactamente la misma lógica, y es código de seguridad: mejor tenerlo una sola vez y testearlo una sola vez.

### DT-25 — Refresh token en cookie httpOnly vía route handlers; el login va directo a la API

- **Contexto:** la spec pide el access token en memoria y el refresh token en una cookie httpOnly "si es posible".
- **Decisión:**
  - El login va **del navegador a la API**.
  - Con la respuesta, el cliente hace `POST /api/session`, un route handler de la propia app que guarda el refresh token en una cookie httpOnly, `SameSite=Lax` y `Secure` en producción, con la duración del token.
  - `POST /api/session/refresh` rota contra la API y devuelve sólo el access token.
  - `DELETE /api/session` revoca en la API y borra la cookie.
- **Por qué el login no pasa por el servidor de Next:** el rate limit de la API (5 por minuto) es por IP. Si el login pasara por Next, todos los usuarios saldrían con la IP del servidor y compartirían esos 5 intentos. El costo es que el refresh token pasa una vez por el JavaScript de la página, en el momento del login. Después vive sólo en la cookie.
- **Por qué no una cookie de la API:** front y API van a estar en dominios distintos (Vercel y Render). Una cookie de la API sería de terceros, y Safari las bloquea.
- **Protecciones:** los route handlers rechazan pedidos con un `Origin` distinto al de la app (evita que un sitio ajeno guarde su propia sesión en el navegador de la víctima). Cada app tiene su prefijo de cookie, porque en localhost las cookies se comparten entre puertos.
- **Límite conocido:** los refresh salen desde la IP del servidor de Next y cuentan contra el límite global por IP de la API (2000 por hora por defecto). Alcanza para cientos de sesiones activas. Si hace falta más, la API puede exceptuar al servidor de Next o contar por usuario; se ve en la Fase 16.

### DT-26 — Refresh serializado entre pestañas (Web Locks)

- **Contexto:** la API rota el refresh token en cada uso y trata el reuso como robo: revoca todas las sesiones. La cookie es compartida entre pestañas.
- **Decisión:** el refresh es de un solo vuelo por pestaña (varios 401 esperan el mismo) y uno a la vez entre pestañas, con `navigator.locks`. La segunda pestaña espera y refresca con la cookie ya rotada.
- **Sin red no se echa a nadie:** si el refresh falla por red o por la API caída, la cookie se conserva y la pantalla muestra "Reintentar". Sólo un rechazo de la API (401/403) cierra la sesión.

### DT-27 — De dónde sale la marca de la inmobiliaria

- **Backoffice:** al iniciar sesión, el route handler pide `GET /tenants/current` con el access token nuevo y guarda nombre, logo y color en otra cookie httpOnly. El layout (server) la lee, así el color está desde el primer render. Cambios de marca se ven en el próximo login.
- **Portal:** `PORTAL_TENANT_SLUG` (variable de servidor, Doppler `dev_portal`) y `GET /tenants/by-slug/:slug`, público, revalidado cada 5 minutos. En la Fase 22 el slug sale del dominio y nada más cambia. Sin slug, el login del portal avisa que no hay inmobiliaria configurada.

### DT-28 — El proxy mira la cookie; `ProtectedRoute` valida

- `src/proxy.ts` (el `middleware` de Next 16) sólo verifica que exista la cookie, y si no, redirige al login con `?next=`. No llama a la API: corre en cada request.
- `ProtectedRoute` recupera el access token con el refresh, pide `/auth/me` y chequea el rol: el backoffice deja entrar a `ADMIN` y `EMPLOYEE`; cada área del portal, a su rol. Un `?next=` sólo se sigue si es una ruta de la misma app (sin open redirect) y, en el portal, de la misma área.
- El proxy no saca del login a quien ya tiene cookie: con una cookie vencida se armaría un loop entre `/login` y la pantalla protegida.

### DT-29 — Pantalla de usuarios en esta fase

- La spec de la Fase 4 sólo pide login y rutas protegidas en el front, pero ninguna fase posterior tiene la pantalla de usuarios, y sin ella un admin sólo podría gestionar empleados desde Swagger.
- **Decisión:** Configuración → Usuarios (sólo admin): listado filtrable y paginado (tarjetas en mobile, tabla en desktop), alta, edición, desactivar/reactivar y reseteo de contraseña, con las mismas reglas que la API (sobre uno mismo no se ofrece desactivar, resetear ni cambiar el rol).

---

## Fase 5 — Maestros

> También **sin supervisión**, en una rama encadenada sobre la de la Fase 4.

### DT-30 — `<MasterDataSelect>` vive en el backoffice

- **Decisión:** el selector reutilizable (spec 6) está en `apps/backoffice/src/components/master-data-select.tsx`, no en `packages/ui`. Necesita el cliente HTTP y React Query de la app; `packages/ui` es sólo presentación y no conoce la API.
- Único (Select) o múltiple (`multiple`, Popover con checkboxes). Ubicaciones con `level` y `parentId`: una cascada son tres selectores encadenados.
- Pide también los desactivados, pero sólo muestra uno si ya estaba elegido, marcado "(desactivado)" y sin poder volver a elegirlo.

### DT-31 — Maestros cacheados 5 minutos

- Son listas que cambian poco: React Query las cachea 5 minutos, y cualquier alta, edición o (des)activación invalida todo lo de maestros, así los selectores de otras pantallas se enteran.

### DT-32 — Íconos de amenities con `lucide-react/dynamic`

- La API guarda el nombre del ícono de lucide (`waves`, `car`). El front lo muestra con `DynamicIcon`, que carga cada ícono a demanda, en lugar de importar los ~1.500 íconos. Un nombre desconocido muestra uno genérico.

### DT-33 — La pantalla de maestros la ve todo el staff

- Los empleados la ven (son los valores que eligen en las altas); sólo un admin ve los controles para cambiarla, igual que en la API.

---

## Fase 6 — Propiedades

> Sin supervisión, rama encadenada sobre la Fase 5.

### DT-34 — Scroll infinito con botón de respaldo

- La spec prefiere scroll infinito en mobile. Se usa `useInfiniteQuery` sobre las páginas de la API y un `IntersectionObserver` al final de la lista; el botón "Cargar más" queda visible para teclado y lectores de pantalla.

### DT-35 — Fotos del alta: se suben después de crear la propiedad

- Las fotos necesitan el id de la propiedad. El wizard crea la propiedad y recién después sube las fotos. Si sólo fallan las fotos, la propiedad queda creada y se avisa que se pueden subir desde la ficha.
- En la edición no hay paso de fotos: se manejan en la ficha.

### DT-36 — Borrador del alta en `localStorage`

- Sólo en el alta y sólo los datos (no las fotos). Se valida con un esquema permisivo (un borrador está incompleto) y se descarta al guardar o con "Empezar de cero". Si el navegador no deja usar `localStorage` (modo privado), el wizard funciona igual sin borrador.

### DT-37 — Imágenes con `<img>` y no `next/image`

- Las fotos vienen de Cloudinary o del storage local de la API, en otro dominio. `next/image` exige declarar cada dominio remoto en `next.config` y los URLs dependen del entorno. Cloudinary ya optimiza las imágenes.

---

## Fase 7 — Propietarios

### DT-38 — Alta y edición en una pantalla, no en wizard

El wizard de propiedades (DT-35) se justifica por las fotos y el borrador. El propietario son pocos campos: una sola pantalla con el formulario, igual de usable en mobile. Sin borrador en localStorage.

### DT-39 — El chequeo en vivo es un aviso, salvo el DNI tomado

`GET /owners/check` se consulta con debounce (300 ms) cuando el DNI tiene entre 7 y 11 dígitos o el CBU 22. Un DNI tomado bloquea el envío y muestra link a esa ficha (es la regla del backend, D-41, anticipada). Un CBU compartido sólo avisa (D-40). En la edición se excluye al propio propietario con `excludeId`.

### DT-40 — La cuenta bancaria sólo se edita desde la ficha

En el alta viaja con el resto (un solo paso). Después, el formulario de edición no la muestra: se cambia desde la ficha con su propio diálogo, que pega a `PATCH /owners/:id/bank-account`. Así el cambio queda como un registro propio en la auditoría (D-40) y el usuario lo hace a propósito, no de paso.

### DT-41 — Selector de propietario con búsqueda contra la API

`OwnerSelect` (Popover + Command con `shouldFilter={false}`) busca por nombre o DNI con el mismo hook del listado, de a 20, con "Ver más". No se cargan todos los propietarios como hacen los maestros (DT-31): una inmobiliaria puede tener cientos. El nombre del elegido se recuerda en el componente; si el valor viene de afuera (edición), la ficha lo pasa como `selectedLabel`.

## Fase 8 — Inquilinos y garantes

### DT-42 — Garantes con pantalla propia y diálogo de alta reutilizable

La spec pide "pantalla propia" para garantes y "crear nuevo inline" desde el inquilino. Las dos cosas usan el mismo `GuarantorFormDialog`: en `/garantes` como alta/edición, y dentro de `GuarantorSelect` como "Crear un garante nuevo", que al guardar deja elegido al creado. Entrada "Garantes" en el menú (en mobile va al cajón "Más").

### DT-43 — WhatsApp: el número se normaliza en el front

`whatsappLink` deja sólo dígitos y agrega `54 9` si el número no trae código de país (quita el `0` de característica y el `00` internacional). La API guarda el teléfono como se cargó: el formato para WhatsApp es un detalle de presentación y, si cambia la regla, no hay que migrar datos.

### DT-44 — Estado de pago: badge gris y filtro deshabilitado hasta la Fase 11

La API devuelve `paymentStatus: null` y acepta el filtro sin aplicarlo (D-46). El listado muestra "Sin datos" en gris y el selector de estado deshabilitado con la leyenda "pronto", como pide la spec 5.1, en vez de ocultarlo: así la pantalla ya tiene su forma final.

### DT-45 — Diálogo de acceso al portal compartido

El de la Fase 7 era de propietarios. Ahora `components/portal-credentials-dialog.tsx` recibe la persona y la mutación; propietarios e inquilinos lo usan igual. `LoadMore` también pasó a `components/` (propiedades conserva su copia de la Fase 6).

## Fase 9 — Contratos

### DT-46 — Wizard de 5 pasos: el de servicios va en la Fase 10

La spec (5.3) pide 6 pasos, con "servicios heredados de la propiedad" en el quinto. La API no recibe servicios en el alta (D-59: viven en `property_services` desde la Fase 10). El wizard tiene 5 pasos (propiedad, inquilino y garante, condiciones, caución, fechas y PDF) y en el último avisa que los servicios se cargan en la próxima etapa. Cuando exista el endpoint, se agrega el paso sin cambiar los otros.

### DT-47 — El selector de propiedad deja afuera las que ya tienen contrato activo

La spec dice "propiedad (solo `disponible`)". La regla real de la API es "sin contrato activo" (RN-04): una propiedad en mantenimiento sin contrato, o marcada alquilada a mano, puede firmar. `PropertySelect` y `RenterSelect` filtran con `activeContractId === null` sobre lo que devuelve la búsqueda (la API no tiene ese filtro; de a 20 resultados alcanza). El propietario no se elige: sale de la propiedad (D-58) y se muestra sólo lectura; sin propietario no se pasa del paso 1.

### DT-48 — La renovación reutiliza el wizard

`POST /contracts/:id/renew` recibe los mismos campos que el alta (menos la propiedad). En vez de otra pantalla, `ContractForm` acepta `original`: precarga todo, fija la propiedad, pone el alquiler inicial igual al vigente y el inicio al día siguiente del fin, y manda `renew`. Sin borrador en `localStorage` (se parte del contrato, no de cero).

### DT-49 — La vista previa de la rescisión es una query

`useTerminationPreview(id, notifiedAt)` pega a `GET /contracts/:id/termination-preview` cada vez que la fecha está completa (`enabled` sólo con `AAAA-MM-DD`, sin reintentos). El diálogo muestra el desglose (alquiler vigente, meses y días, alquiler futuro, multa) y el botón "Confirmar rescisión" sólo se habilita con una vista previa cargada: el usuario siempre ve el número antes de confirmar (spec 5.4). Un 400 de la API (fecha fuera del contrato) se muestra en el mismo lugar.

### DT-50 — Badges del contrato sobre las variantes existentes

`ACTIVE` vigente → `disponible` (verde), `expiringSoon` → `mantenimiento` (amarillo, "Vence pronto"), `expired` → `mora` (rojo, "Vencido"), `TERMINATED` → `mora` ("Rescindido"), `FINISHED` → `borrador` (gris). "Caución vencida" es un `outline` aparte, al lado del estado. Las condiciones (`expiringSoon`, `expired`, `suretyExpired`) las calcula la API con los días de aviso del tenant; el front no compara fechas para eso. La póliza sí tiene su propio badge en la ficha (`policyExpiryMeta`, 30 días de aviso) porque la API sólo dice si venció.

### DT-51 — Dinero: sólo formato, en un helper

`formatMoney(amount, currency)` usa `Intl.NumberFormat("es-AR", { style: "currency" })` sobre el string de la API y nada más (DT-11). Los montos que escribe el usuario se normalizan como texto (`normalizeAmount`: "480.000,50" → "480000.50") sin convertir a número. El único `Number()` es el que `Intl` necesita para formatear.

### DT-52 — Fechas compartidas en `lib/dates.ts`

`formatDate` salió de `lib/renters.ts` porque contratos la usa en todos lados. Las cuentas de días (badge de póliza, "en N días", inicio de la renovación) se hacen en UTC a partir del string `AAAA-MM-DD`: sin `new Date("2026-03-01")` local, que en Argentina da el día anterior.

## Fase 10 — Servicios y gastos adelantados

### DT-53 — Una sola sección de servicios para propiedad y contrato; sin paso en el wizard

`ServicesSection` vive en `propiedades/[id]/` y la ficha del contrato la importa con `contractId` y el resultado de `useContractServices`, que trae los propios y los heredados con `scope` (D-66). La única diferencia visual es la marca "Del contrato" / "De la propiedad". Dos tablas casi iguales habrían divergido en el primer cambio. Por lo mismo no se agregó el paso "servicios" al wizard que DT-46 dejaba previsto: la API ata el servicio a un `contractId` que no existe hasta crear el contrato, y los servicios de la propiedad ya se heredan solos. Si Micaela pide cargarlos en el alta, es un paso que llama a `POST /properties/:id/services` después del `POST /contracts`, igual que el PDF.

### DT-54 — Desde la ficha del contrato, el servicio nuevo es del contrato

"Agregar servicio" en la ficha del contrato manda `contractId`; en la ficha de la propiedad, `null`. Es lo que el usuario está mirando: si está en el contrato, el servicio es de ese inquilino. Los heredados se editan desde cualquiera de las dos fichas (el `PATCH` no cambia la propiedad ni el contrato), así que no hace falta ir a la propiedad para corregir una fecha. Con la propiedad eliminada (`contract.property === null`) la sección se lista pero no deja agregar.

### DT-55 — El comprobante se valida antes de subir y es obligatorio sólo al registrar

La API exige el archivo por contenido (D-67). El front repite la regla por tipo MIME o extensión (JPG, PNG, WebP, PDF) y por tamaño (10 MB) en `receiptProblem`, para avisar antes de mandar 10 MB que van a rebotar. Al editar no se muestra el campo: la API no cambia el comprobante de un gasto, y un gasto mal cargado se elimina y se vuelve a registrar. `EXPENSE_ALREADY_SETTLED` (409) se muestra como error general y la sección se refresca.

### DT-56 — "Liquidación {id}" sin link hasta la Fase 12

La spec (5.2) pide el badge "Descontado en liquidación #X" con link a la liquidación "cuando exista". `ExpenseStatus` muestra el badge verde y, debajo, el `settlementId` como texto. Cuando la Fase 12 cree `/liquidaciones/[id]`, se cambia el `span` por un `Link` y nada más.

### DT-57 — Vencidos en el dashboard: cinco a la vista, "Ver todos" con scroll infinito

El dashboard real llega en la Fase 19, pero la spec (3.1) pide ver los vencidos de toda la inmobiliaria y la API ya los pagina del más atrasado al menos. `OverdueServices` muestra la primera página recortada a cinco filas con el total en el badge; "Ver todos" destapa la página entera y agrega `LoadMore`. Así la pantalla no se llena con cien filas si la inmobiliaria viene atrasada, y el componente se mueve tal cual a la tarjeta del dashboard de la Fase 19. Invalida con el resto de `services`: al corregir un vencimiento en una ficha, el dashboard se actualiza solo.

## Fase 11 — Cobros y punitorios

### DT-58 — Pantallas escritas en paralelo contra nombres de DTOs acordados

El backend y el frontend de la fase se hicieron a la vez: los nombres de los DTOs de vista (`InstallmentSummaryDto`, `PaymentDto`, `ContractAccountDto`, …) se fijaron por escrito antes de codear y el frontend arrancó con interfaces a mano en `shared-types/billing.ts`. Cuando el backend exportó el `openapi.json`, se regeneraron los tipos y el archivo pasó a ser alias de `ApiSchemas`, como el resto. La única diferencia que apareció fue un valor más en `AccountMovementType` (`LATE_FEE_ACCRUED`), que el `Record` de etiquetas obligó a contemplar. Si en otra fase se repite el patrón, la regla es la misma: alias en cuanto exista el contrato, nunca interfaces a mano en `main`.

### DT-59 — Cobros arranca en el mes actual; `?renterId=` muestra todas las cuotas de un inquilino

`/cobros` muestra el mes en curso con el resumen por moneda; las flechas y el `<input type="month">` cambian de mes. Desde la ficha del inquilino se llega con `?renterId=`: ahí no hay mes ni resumen, se listan todas sus cuotas, de la más nueva a la más vieja. `useSearchParams` obliga a envolver la pantalla en `Suspense` en la `page`.

### DT-60 — El estado de la cuota es el de la API; el front sólo lo pinta

`PENDING`, `PARTIAL`, `OVERDUE` y `PAID` vienen calculados (D-71); el badge agrega los días de punitorio ("Vencida · 5 días") con `feeDays`, también de la API. Dos badges más salen de campos ya calculados: "Pago sin confirmar" (`pendingConfirmationTotal` distinto de cero) y "Punitorio condonado" (`lateFeeWaived`). Nada se deduce de fechas en el front.

### DT-61 — Toda mutación de cobros invalida la clave `billing` entera

Un pago cambia la cuota, el resumen del mes, la cuenta corriente del contrato, los créditos del inquilino y su mora. En vez de invalidar cada clave, `useBillingMutation` invalida `["billing"]` y listo; además los listados de inquilinos muestran mora, pero la leen de `billing/arrears`, así que también quedan al día. Es más consulta de la necesaria y menos riesgo de una pantalla vieja; si pesa, se afina por clave.

### DT-62 — La imputación manual no suma en el front

DT-51 prohíbe aritmética de plata en el cliente. El diálogo de pago muestra el saldo de cada concepto al lado del campo y manda los tres montos como vienen; la API valida que sumen lo pagado y no superen los saldos (`PAYMENT_INVALID_ALLOCATION`) y el mensaje vuelve al campo "Alquiler". Lo mismo con la cotización: el equivalente lo calcula la API y se muestra después.

### DT-63 — La cotización se exige en el front cuando la moneda difiere, y la API la vuelve a exigir

Con la moneda del pago distinta de la del contrato aparecen cotización, fuente y fecha; sin cotización o fuente no se manda (A-9). La API responde igual `PAYMENT_EXCHANGE_RATE_REQUIRED`, que también se mapea al campo: la regla vive en los dos lados porque la del front es sólo para avisar antes.

### DT-64 — Anulaciones con motivo en un diálogo compartido

Pagos y cargos se anulan con `ReasonDialog` (motivo obligatorio, botón destructivo); el diálogo recibe la mutación como función. Lo mismo vale para la Fase 12 (cancelar liquidaciones, anular transferencias). Sólo admin ve el tacho en los pagos; en los cargos puede cualquiera mientras la cuota no esté cobrada, y la API rechaza con 409 si ya tienen imputaciones.

### DT-65 — Los términos de cobro comparten campos entre el wizard y la ficha

`BillingTermsFields` (en `change-billing-terms-dialog.tsx`) y `billingTermsSchema` se usan en el diálogo de la ficha y en el paso "Condiciones" del wizard, con el mismo truco de tipos que `SuretyFields` (DT-46). En el alta el porcentaje no se carga: lo fija la API según el propietario (D-57) y el campo se reemplaza por un texto (`percentageEditable={false}`); el wizard quita del `superRefine` los errores de `feePercentage`. La renovación propone los términos vigentes del original, que la API recibe como campos del alta.

### DT-66 — Mora en lote para el listado de inquilinos

El listado pide `/billing/arrears` una vez con todos los ids de la página cargada (`useArrears`), en vez de una consulta por fila, y mantiene un `Map` por inquilino. El filtro por estado de pago sigue deshabilitado: la API todavía no filtra (D-46) y filtrar en el cliente mentiría sobre el total. El badge "Sin datos" quedó para mientras carga.

## Fase 12 — Liquidaciones

### DT-67 — Una pantalla con tres pestañas: liquidaciones, consolidados y honorarios

Las tres cosas son del mismo flujo mensual y el usuario pasa de una a otra: liquida, agrupa en el consolidado, cobra los honorarios que no se descontaron. Van en `/liquidaciones` con pestañas (la pestaña inicial sale de `?tab=`), igual que Cobros con sus pagos por confirmar (DT-59). Los consolidados tienen ficha propia en `/liquidaciones/consolidados/[id]`; los honorarios no: su detalle vive en la ficha del propietario, que es donde se cobran.

### DT-68 — Las mutaciones de liquidaciones invalidan también cobros, gastos y propietarios

Confirmar una liquidación marca pagos (`settlementId`) y gastos adelantados (`settled`), y mueve la cuenta de honorarios del propietario. En vez de perseguir cada clave, `useSettlementMutation` invalida `settlements`, `billing`, `advance-expenses` y `owners` (misma lógica que DT-61). Es más consulta y menos pantallas viejas.

### DT-69 — El signo de los ajustes lo da el concepto, no el usuario

El diálogo pide un monto siempre positivo y el concepto decide: retención, adelanto y otra deducción restan; "otro a favor del propietario" suma (`adjustmentSubtracts`). El total de ajustes viene con signo de la API y se muestra con "−" delante cuando es negativo, sin hacer cuentas (DT-51).

### DT-70 — Transferir sólo con neto positivo; el neto negativo se informa

Una liquidación puede quedar con neto negativo (gastos y retenciones mayores que lo cobrado): se confirma igual para que quede registrado que el propietario debe, pero el botón "Registrar transferencia" no aparece. La API rechaza de todos modos una transferencia que supere el neto (`SETTLEMENT_TRANSFER_EXCEEDS_NET`, mapeado al campo importe).

### DT-71 — La devolución del depósito vive en la cuenta corriente del contrato

El botón "Devolver depósito" aparece en la sección "Cuenta corriente" de la ficha del contrato cuando el contrato no está activo y todavía no se devolvió; el diálogo propone el monto sugerido por el modo de devolución (`deposit.suggestedReturn`) y arma las deducciones como filas (concepto, justificación, monto; una deuda puede imputarse a una cuota con saldo). La suma la valida la API (`DEPOSIT_RETURN_UNBALANCED`): el front sólo muestra el mensaje con el depósito recibido. Una vez devuelto, la misma sección lo muestra y el botón desaparece.

### DT-72 — Configuración de honorarios del propietario junto a su cuenta, no en el alta

El % propio, la base (punitorios y/o cargos) y el modo de envío se editan desde la ficha del propietario, en la sección "Honorarios", sólo admin. No van en el formulario de alta/edición de propietarios: son excepciones a la regla de la inmobiliaria y quedan a la vista de lo que afectan (la cuenta de honorarios). Hasta que la API los devolvió, el front los trataba como opcionales; con el `openapi.json` de la fase pasaron a obligatorios en `OwnerDetail`.

## ⚠️ Inconsistencias detectadas en las specs (a revisar, no resueltas)

1. **Precio y descripción pública de la Propiedad.** El PRD 5.1 no define campo de precio ni descripción pública (solo `observaciones`, que son notas internas). Pero la Fase 22 filtra por `precioDesde/precioHasta` y muestra "precio" y "descripción" en la ficha pública, y la Fase 24 habla de "el paso donde se carga el precio" en el alta de Propiedad. Los mocks **no** inventan esos campos (regla de la Fase 2). Hay que definirlo antes de la Fase 6 o de la Fase 22.
2. **Fase 16, 2.3** menciona `VITE_API_URL`: quedó de cuando el backoffice era React+Vite. Con Next.js la variable es `NEXT_PUBLIC_API_URL`.
3. **Fase 22** dice "sin foco SEO", pero el PRD 14.1 y el pedido del scaffold piden SSR/SSG para SEO. El scaffold ya hace SSG de la home y de las fichas, que no cuesta nada extra.
