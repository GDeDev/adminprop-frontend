# Diseño v2 — documentación técnica

Rama `feature/design-v2` (sobre `feature/fase-24-tasacion-automatica`).
Rediseño del sistema de diseño, **aprobado por el dueño y adoptado en backoffice
y portal** (rama `feat/design-v2-adopcion`, DT-112). Análisis y justificación:
`docs/design/ANALISIS_DESIGN_SYSTEM.md`. Fuente a llevar al repo de lineamientos:
`docs/design/source-v2/`. Decisiones: DT-107 a DT-112.

## Qué se agregó

| Archivo                                                                                                        | Para qué                                                                        |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/ui/src/styles/adminprop-v2.css`                                                                      | Tokens v2 (OKLCH, claro y oscuro), `@theme`, escala tipográfica, radios, curvas |
| `packages/ui/src/styles/adminprop-v2-effects.css`                                                              | Utilidades de superficie/efecto/movimiento y keyframes (`@utility`)             |
| `packages/ui/src/styles/globals.css`                                                                           | Elige la versión con un `@import`                                               |
| `packages/ui/src/lib/color.ts`                                                                                 | OKLCH/hex → sRGB y relación de contraste WCAG (para tests)                      |
| `packages/ui/src/lib/count-up.ts` + `hooks/use-count-up.ts`                                                    | Contador animado (solo presentación)                                            |
| `components/ai-badge.tsx`, `stat-card.tsx`, `gradient-surface.tsx`, `animated-list.tsx`, `command-palette.tsx` | Componentes nuevos                                                              |
| `apps/*/src/lib/fonts.ts`                                                                                      | Bricolage Grotesque + Geist + Geist Mono (y Outfit/Figtree sin precarga)        |
| `apps/backoffice/src/app/design-system/`                                                                       | Vitrina (movida fuera de `(dashboard)`)                                         |

`adminprop.css` (v1) se retiró en la adopción (ver «Volver a v1»).

## Volver a v1

La v2 es el único sistema: `globals.css` importa solo `adminprop-v2.css` y
`adminprop.css` ya no está en el repo (tampoco Outfit/Figtree). Para volver:

1. Recuperar los tokens: `git show <commit-anterior-al-retiro>:packages/ui/src/styles/adminprop.css`
   (el commit `refactor(ui): make v2 the only design system` lo borra; el
   original también vive en `adminprop-repo-files/packages-ui-source/globals.css`).
2. Cambiar el import de `globals.css` y volver a declarar Outfit y Figtree en
   `apps/*/src/lib/fonts.ts` y en el `<html>` de cada layout.
3. Revertir los commits de componentes (`feat(ui): restyle base components…`,
   `feat(ui): add AiBadge…`) y de adopción: los componentes y las pantallas usan
   `shadow-raised`, `pressable`, `lift`, `num`, `bg-overlay`, `text-title-*`,
   que v1 no define. Con solo el import, se pierden sombras, velo de diálogos,
   degradé y la escala tipográfica. En la práctica, no mergear esta rama.

## Adopción en las pantallas

Lo que se migró en `apps/backoffice` y `apps/portal` (no `apps/sites`):

- **Paneles** (`rounded-xl border bg-card`): `shadow-raised`; los que son links
  (`transition-colors hover:bg-muted`) pasan a `lift`.
- **KPIs**: `StatCard` en el dashboard (cobradas/parciales/pendientes/vencidas y
  los totales del mes), el resumen de cobros, los totales del consolidado, el
  resumen de CRM, las analíticas de la propiedad y el estado de cuenta del
  propietario en el portal. El valor es siempre el string de la API; con
  varias monedas no se anima.
- **Tipografía**: títulos de pantalla `text-title-lg md:text-display-md`,
  secciones `text-title-md`, `tabular-nums` → `num`.
- **Montos** de celdas y filas de detalle en `font-display num`.
- **IA**: `Button variant="ai"` y `AiBadge` en «Sugerir precio» (ficha de
  propiedad). Es lo único asistido hoy; `Badge variant="ia"` queda disponible.
- **Vitrina**: sección «Patrones de pantalla» (montos, botón `loading`, tarjeta
  `lift`, skeleton, error con `EmptyState`).
- **Estados**: los listados ya usaban `EmptyState` con «Reintentar» para el
  error y `Skeleton` para la carga; no se cambió.
- Prueba: `packages/ui/test/apps-v2-language.test.ts` lee las pantallas.

## Cómo se arma el CSS

- `adminprop-v2.css` hace `@import "tailwindcss"` y `@import` del archivo de
  efectos; los tokens son variables CSS en `:root` y `.dark`, y `@theme inline`
  las expone como utilidades de Tailwind (`bg-ai`, `text-ai`, `bg-overlay`…).
- Las sombras `shadow-xs/sm/md/lg` de Tailwind están remapeadas a los
  niveles de elevación (`--elev-1..4`), así que el código existente sube de
  nivel sin cambios. Las utilidades `shadow-edge/raised/float/overlay` suman el
  reborde de luz.
- Las curvas (`--ease-*`) están en `@theme static` para existir siempre como
  variables.
- Lo derivado del tema de la inmobiliaria usa `color-mix(in oklab,
var(--primary) …)`: glow, degradé del botón, `bg-mesh`. `tenantThemeStyle`
  no cambió.

## Componentes

APIs públicas intactas (props y variantes), con estas adiciones aditivas:
`Button variant="ai"`, `Badge variant="ia"`. Cambios de apariencia relevantes:

- **Button**: degradé `bg-primary-gradient`, reborde de luz, `hover:glow-primary`,
  `pressable` (escala 0,97). Sin `transition-all`.
- **Card/Table/Alert**: `shadow-raised` / `shadow-edge`; tabla con encabezado
  `text-xs` apagado, filas de 44 px y cifras tabulares.
- **Input/Select/Textarea/Checkbox/Radio**: fondo `card`, borde que se
  oscurece al hover, foco con halo de `ring/25`.
- **Tabs**: 44 px en mobile, activo sobre `card`; variante `line` con subrayado
  `primary`.
- **Dialog/Sheet/Drawer**: velo `bg-overlay`, `shadow-overlay`, botón de
  cierre de 36 px y texto accesible «Cerrar» (antes «Close»).
- **Skeleton**: `shimmer` (pseudo-elemento con `transform`) en lugar de
  `animate-pulse`.
- **AppSidebar/BottomNav/EmptyState/Sonner**: ver `ADMINPROP-UI-v2.md`.

`AppShell` del backoffice suma `CommandPalette` (Ctrl/⌘+K y botón «Buscar»
con las secciones del menú), header mobile con `glass` y `page-enter` por
ruta. El portal suma header con resplandor, héroe `GradientSurface`, listado
con `AnimatedList` y tarjetas con `lift`.

## Tests

| Test                                                | Qué cubre                                                                                                                                                                                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/test/contrast.test.ts`                 | 33 pares texto/fondo en claro y oscuro leyendo el CSS real; texto sobre el primary de 5 tenants de ejemplo; barrido de tonos del tenant (piso 3.9:1)                                                                                                                    |
| `packages/ui/test/design-rules.test.ts`             | Reglas v2: sin literales de color, sin `transition-all`/`animate-pulse`/layout animado, sin blur en componentes de listas, targets de 44 px, v2 conserva todos los tokens de v1, claro/oscuro simétricos, keyframes solo transform/opacity, cobertura de reduced-motion |
| `packages/ui/src/lib/count-up.test.ts`              | El contador termina en el string exacto, formatos es-AR, monotonía                                                                                                                                                                                                      |
| `packages/ui/src/components/v2-components.test.tsx` | AiBadge, StatCard (reduced-motion, animación con timers falsos, IA), GradientSurface, AnimatedList, CommandPalette (atajo, selección, keywords)                                                                                                                         |

## Rendimiento

- Solo `transform` y `opacity` se animan; el shimmer mueve un pseudo-elemento.
- `backdrop-filter` solo en el header mobile del backoffice, la `BottomNav`, el
  header del portal y la paleta/diálogos; nunca en filas de listas o tablas
  (test).
- Sin dependencias nuevas. Las tres fuentes nuevas (Bricolage, Geist, Geist Mono)
  son variables; Geist Mono no se precarga. Outfit y Figtree tampoco.
- Sin imágenes ni SVG pesados: el destello de IA es un `path` inline.

## Propuesta para `apps/sites` (no incluido)

Los sitios por inmobiliaria con tema propio por variables CSS pueden adoptar la
v2 importando `adminprop-v2.css` y sobrescribiendo solo `--primary` y
`--primary-foreground`. Todo lo derivado (degradé, glow, mesh) las sigue. Antes
hay que revisar que su paleta propia no pise tokens `ai*`, `overlay` ni
`surface-sunken`, nuevos en v2.

## Transiciones de vista

`@view-transition { navigation: auto }` está en los efectos (fundido entre
documentos, progresivo y apagado con reduced-motion). La navegación del App
Router es del lado del cliente y no la dispara; la entrada de pantalla se
resuelve con `page-enter`. Propuesta pendiente: evaluar `<ViewTransition>` de
React cuando deje de ser experimental en Next.

## Qué no se pudo verificar

- Las fichas de detalle (`[id]`), formularios largos, wizard de contrato y
  diálogos abiertos con datos reales. En la adopción se revisaron los listados
  y resúmenes con una API falsa descartable (`docs/design/capturas-adopcion/`).
- Animaciones en movimiento real: las capturas se tomaron con
  `reducedMotion: reduce`. Los tests cubren la lógica, no la fluidez.
- Rendimiento medido (FPS, INP) en dispositivos reales.
- Lectura con lector de pantalla.
- `apps/sites` y el `(dashboard)/crm` de la Fase 23 no existen o no se tocaron.
