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

## ⚠️ Inconsistencias detectadas en las specs (a revisar, no resueltas)

1. **Precio y descripción pública de la Propiedad.** El PRD 5.1 no define campo de precio ni descripción pública (solo `observaciones`, que son notas internas). Pero la Fase 22 filtra por `precioDesde/precioHasta` y muestra "precio" y "descripción" en la ficha pública, y la Fase 24 habla de "el paso donde se carga el precio" en el alta de Propiedad. Los mocks **no** inventan esos campos (regla de la Fase 2). Hay que definirlo antes de la Fase 6 o de la Fase 22.
2. **Fase 16, 2.3** menciona `VITE_API_URL`: quedó de cuando el backoffice era React+Vite. Con Next.js la variable es `NEXT_PUBLIC_API_URL`.
3. **Fase 22** dice "sin foco SEO", pero el PRD 14.1 y el pedido del scaffold piden SSR/SSG para SEO. El scaffold ya hace SSG de la home y de las fichas, que no cuesta nada extra.
