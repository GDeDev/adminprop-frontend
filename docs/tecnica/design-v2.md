# Diseño v2 — documentación técnica

Rama `feature/design-v2` (sobre `feature/fase-24-tasacion-automatica`).
Propuesta implementada del rediseño del sistema de diseño; no reemplaza nada
hasta que el dueño la apruebe. Análisis y justificación:
`docs/design/ANALISIS_DESIGN_SYSTEM.md`. Fuente a llevar al repo de lineamientos:
`docs/design/source-v2/`. Decisiones: DT-154 a DT-158.

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

`adminprop.css` (v1) no se tocó.

## Activar la v2 y volver a v1

`packages/ui/src/styles/globals.css`:

```css
@import "./adminprop-v2.css"; /* v2 — activa */
/* @import "./adminprop.css";    v1 */
```

**Límite honesto de la vuelta atrás.** Cambiar el import devuelve los tokens
(colores, radios, fuentes) a v1, pero los componentes de `packages/ui` ya
tienen las clases v2 (`shadow-raised`, `pressable`, `bg-overlay`,
`bg-primary-gradient`, `shimmer`…), que v1 no define: sin ellas se pierden
sombras, velo de diálogos y degradé, y el skeleton queda sin animación. Para
una vuelta atrás completa:

1. Cambiar el import (tokens v1).
2. Revertir los commits `feat(ui): restyle base components…`,
   `feat(ui): add AiBadge…`, `feat(backoffice,portal): apply design v2…` y
   `feat(backoffice): rebuild the design-system showcase…` (o, más simple, no
   mergear esta rama).

Las fuentes de v1 siguen declaradas (sin precarga), así que el paso 1 no deja
la tipografía sin definir.

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

- Las pantallas reales del backoffice (dashboard, listados, fichas) y del
  portal logueado: requieren sesión y API, que no hay en esta sesión. Se
  verificó la vitrina, los logins y el listado público del portal (con la API
  caída, así que se ve el estado vacío, no tarjetas de propiedades).
- Animaciones en movimiento real: las capturas se tomaron con
  `reducedMotion: reduce`. Los tests cubren la lógica, no la fluidez.
- Rendimiento medido (FPS, INP) en dispositivos reales.
- Lectura con lector de pantalla.
- `apps/sites` y el `(dashboard)/crm` de la Fase 23 no existen o no se tocaron.
