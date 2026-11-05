# Adminprop — UI: reglas para el repo ("Cobre sobre tinta")

Reemplaza a `ADMINPROP-UI.md` (v1): el dueño aprobó este sistema y es el único
vigente. Mismo stack (Next.js App Router + Tailwind v4 + shadcn/ui), mismas
reglas de producto; cambia el lenguaje visual: paleta en OKLCH, superficies con
profundidad, tipografía con jerarquía fuerte y movimiento coreografiado.

## Fuente de verdad

1. `adminprop-v2.css` (+ `adminprop-v2-effects.css`) — los tokens y las
   utilidades. Ningún componente escribe un color: todo sale de esas variables.
2. Esta guía.
3. La vitrina `/design-system` del backoffice (solo desarrollo): tokens,
   tipografía, elevación, movimiento y cada componente en claro y oscuro.

En el frontend los archivos viven en `packages/ui/src/styles/`. Esta carpeta
(`docs/design/source-v2/`) tiene copias textuales para llevar a
`adminprop-repo-files/packages-ui-source/`.

## Setup

Fuentes con `next/font/google` (variables que esperan los tokens):

```ts
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google"
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  axes: ["opsz"],
})
export const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
})
// <html className={cn(display.variable, sans.variable, mono.variable)}>
```

Sin red o sin las fuentes, los tokens caen a la pila de sistema
(`ui-sans-serif, system-ui…`): la interfaz sigue funcionando, solo cambia la
letra.

## Reglas que no se negocian (heredadas de v1)

- **`accent` es el cobre de la marca, no el hover.** El hover es `muted`. Al
  instalar un componente nuevo de shadcn hay que cambiar los `hover:bg-accent`
  por `hover:bg-muted` (`design-rules.test.ts` lo marca).
- **`primary` es lo único que cambia por cliente.** El server pisa
  `--primary` y `--primary-foreground` en el `<html>`. Todo lo derivado
  (glow, degradé, anillos, héroes) se calcula con `color-mix()` sobre
  `--primary`, así que sigue al tenant solo.
- **El chrome oscuro no es tema.** Sidebar, bottom-nav y los logins usan
  `sidebar*` en claro y en oscuro.
- **Mobile primero**, 44 px de área táctil, foco visible, texto 4.5:1.
- **Montos**: `font-display num`, alineados a la derecha. El frontend no los
  calcula: la API manda strings. Las cifras clave (KPIs) van en `StatCard`.
- **Carga**: `Skeleton` con la forma del contenido. Sin spinners centrados.
- **Mobile = Drawer** para lo que en desktop es `Dialog` o menú largo.

## Reglas nuevas de v2

### Color

- Los tokens están en **OKLCH**. Para sumar uno nuevo, respetar la
  luminosidad de su familia (los `*-soft` ≥ 0.94 en claro, ≤ 0.32 en oscuro;
  los de texto ≤ 0.5 en claro, ≥ 0.7 en oscuro) y agregarlo a
  `test/contrast.test.ts`.
- **Los pares texto/fondo cumplen WCAG AA** en los dos modos y lo verifica un
  test que lee el CSS real. Si un cambio de token rompe un par, el test falla.
- Los bordes (`--border`, `--input`) son **translúcidos**: se adaptan a la
  superficie. No se reemplazan por colores opacos.

### Elevación (4 niveles)

| Nivel | Utilidad         | Uso                              |
| ----- | ---------------- | -------------------------------- |
| 1     | `shadow-edge`    | Botones outline, alertas, chips  |
| 2     | `shadow-raised`  | Cards, tablas, KPIs              |
| 3     | `shadow-float`   | Popovers, menús, selects, toasts |
| 4     | `shadow-overlay` | Diálogos, drawers, sheets        |

Las clases `shadow-xs/sm/md/lg` de Tailwind están remapeadas a los mismos
niveles. En oscuro la elevación también suma un reborde de luz de 1 px
arriba. El velo de diálogos es `bg-overlay`.

### Efectos (con medida)

- **Glow**: uno por pantalla, el CTA principal (`hover:glow-primary` ya viene
  en `Button`). El glow de IA (`glow-ai`) solo en acciones de IA.
- **Glass** (`glass`, `glass-dark`, `backdrop-blur` en bottom-nav y headers):
  solo en superficies flotantes chicas. **Nunca** en filas de listas ni de
  tablas, ni en componentes que se repiten (Card, Badge, Table, Skeleton): lo
  verifica `design-rules.test.ts`.
- **Mesh / dots** (`bg-mesh`, `bg-mesh-soft`, `bg-dots`): héroes, login y
  estados vacíos. No en pantallas de datos densos.
- **IA** (`ai`, `ai-soft`, `ai-border`, `AiBadge`, `Button variant="ai"`,
  `StatCard ai`): **solo** marca lo que generó o sugirió el sistema. Si lo
  cargó una persona, no lleva IA. El degradé (`bg-ai-gradient`,
  `text-gradient-ai`) es decorativo: no se pone texto de lectura encima.

### Tipografía

Display **Bricolage Grotesque** (títulos y cifras), cuerpo **Geist**, datos
**Geist Mono**. Escala con nombre; el tracking baja a medida que sube el
tamaño:

| Clase             | Tamaño | Uso                                 |
| ----------------- | ------ | ----------------------------------- |
| `text-display-xl` | 52 px  | Héroes (portal, vitrina)            |
| `text-display-lg` | 40 px  | Título de pantalla destacada        |
| `text-display-md` | 30 px  | Título de pantalla, cifras de KPI   |
| `text-title-lg`   | 24 px  | Secciones                           |
| `text-title-md`   | 19 px  | Títulos de card, estados vacíos     |
| `text-title-sm`   | 16 px  | Subtítulos                          |
| `text-body`       | 15 px  | Texto base (default del `body`)     |
| `text-label`      | 13 px  | Etiquetas de campo, meta            |
| `text-caption`    | 12 px  | Notas, ayudas, encabezados de tabla |

Usar `num` (tabulares, sin ligaduras) en cualquier cifra que se compare o
alinee. `h1`, `h2` y `h3` ya usan `font-display`.

### Radios

`rounded-sm` 6 · `md` 10 (controles) · `lg` 14 · `xl` 20 (superficies) ·
`2xl` 28 · `full`.

### Movimiento

| Token               | Valor                         | Uso                       |
| ------------------- | ----------------------------- | ------------------------- |
| `--duration-fast`   | 120 ms                        | Press, hover de color     |
| `--duration-base`   | 200 ms                        | Menús, popovers, escala   |
| `--duration-slow`   | 320 ms                        | Entrada de contenido      |
| `--duration-slower` | 500 ms                        | Entrada de pantalla       |
| `--ease-out`        | `cubic-bezier(.22,1,.36,1)`   | Entradas (default)        |
| `--ease-in-out`     | `cubic-bezier(.65,0,.35,1)`   | Bucles (shimmer, sparkle) |
| `--ease-spring`     | `linear()` con rebote de ~8 % | Switch y toggles          |

Utilidades: `animate-fade-up`, `animate-scale-in`, `animate-fade-in`,
`animate-slide-in-right`, `stagger` (hijos de a uno, 40 ms, tope 8),
`page-enter`, `pressable`, `lift`, `shimmer`.

Reglas:

1. Se anima **solo `transform` y `opacity`** (un test lee los `@keyframes`).
2. Nunca animar `width`, `height`, `top`, `left`, márgenes ni `filter: blur()`.
3. Todo movimiento tiene versión `prefers-reduced-motion` (test).
4. `stagger` / `AnimatedList` solo para la primera carga de listas cortas
   (≤ 12 ítems).
5. Sin librerías de animación; si algo no se puede con CSS + un hook, se
   discute antes de sumar una dependencia.

## Estados del dominio → tokens

| Estado                                 | Fondo              | Texto              | Variante de `Badge` |
| -------------------------------------- | ------------------ | ------------------ | ------------------- |
| Disponible · Al día · Cobrado          | `success-soft`     | `success`          | `disponible`        |
| Alquilada · Informativo                | `info-soft`        | `info`             | `alquilada`         |
| Por vencer · En mantenimiento          | `warning-soft`     | `warning`          | `mantenimiento`     |
| En mora · Vencido                      | `destructive-soft` | `destructive`      | `mora`              |
| Borrador                               | `muted`            | `muted-foreground` | `borrador`          |
| **Sugerido / generado por IA** (nuevo) | `ai-soft`          | `ai`               | `ia` (o `AiBadge`)  |

Los estados llevan además un anillo interno de 1 px (`ring-inset` al 15 %) que
define el borde de la píldora sin sumar peso.

## Componentes propios

Los de v1, con el estilo nuevo y la misma API: `BottomNav` (cinco destinos,
indicador de cobre arriba, fondo `sidebar` con blur solo si el navegador lo
soporta), `AppSidebar` (248 px, resplandor de cobre en la esquina,
indicador lateral del ítem activo), `EmptyState` (malla suave, ícono en
`primary-soft`).

Nuevos en v2 (todos en `packages/ui`):

- `AiBadge`, `AiSparkle` — marca de contenido asistido por IA.
- `StatCard` — KPI con contador animado. `value` es el string final de la
  API; el contador solo lo interpola visualmente y **termina siempre en ese
  string exacto** (no se calcula nada).
- `GradientSurface` — `brand` (héroe con el primary del tenant), `ai`
  (borde degradé) y `mesh` (atmósfera suave).
- `AnimatedList`, `AnimatedListItem` — entrada escalonada en CSS puro.
- `CommandPalette` — ⌘K / Ctrl+K sobre `cmdk`; cada ítem tiene que existir
  también en la navegación normal.
- `Button variant="ai"` y `Badge variant="ia"` — variantes aditivas.

## Tema por inmobiliaria

Igual que en v1:

```tsx
<html style={tenantThemeStyle(branding?.primaryColor)}>
```

`tenantThemeStyle` no cambió. Límite conocido: con un color de luminosidad
media (entre el azul de Adminprop y un amarillo) ni el texto claro ni el
oscuro llegan a 4.5:1 sobre el botón; el piso medido es 3.96:1. Recomendación
de producto: validar el color al guardarlo.

## Qué se heredó y qué cambió

|                    | v1                                                       | v2                                                                                                    |
| ------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Nombres de token   | `background`, `primary`, `accent`, `*-soft`, `sidebar*`… | **Todos se mantienen**; se suman `ai*`, `surface-sunken`, `overlay`                                   |
| Formato de color   | hex                                                      | OKLCH (borders translúcidos)                                                                          |
| Paleta             | marino + cobre + crema                                   | marino + cobre + papel cálido; el cobre es más luminoso; violeta solo para IA                         |
| Tipografía         | Outfit + Figtree                                         | Bricolage Grotesque + Geist (+ Geist Mono), con escala con nombre                                     |
| Elevación          | 3 sombras de una capa                                    | 4 niveles de 2–3 capas + reborde de luz                                                               |
| Radios             | 8 / 12 / 16 / 20                                         | 6 / 10 / 14 / 20 / 28                                                                                 |
| Movimiento         | `animate-pulse` y `tw-animate-css`                       | Tokens de duración y curvas, `shimmer`, `stagger`, `pressable`, resorte                               |
| Contraste          | sin chequeo; `muted-foreground` 3.77:1 sobre `muted`     | test de contraste AA en claro y oscuro                                                                |
| Reglas             | `hover:bg-accent`, hex, `text-white`                     | + sin literales de color, sin `transition-all`, sin `animate-pulse`, keyframes solo transform/opacity |
| Reglas de producto | —                                                        | **sin cambios**                                                                                       |

## Accesibilidad

- Texto 4.5:1 y no textuales 3:1, verificados por test en los dos modos.
- Foco visible: anillo de 3 px con `ring/25–40 %` más el `outline` global.
- 44 px en mobile para botones, inputs, selects y tabs.
- `prefers-reduced-motion`: sin animaciones, sin contador, sin shimmer.
- Los contadores animados exponen el valor final a lectores de pantalla.

## Volver a v1

No hay marcha atrás por un import: `adminprop.css` (v1) se retiró del frontend y
los componentes y pantallas usan clases que solo existen en v2 (`shadow-raised`,
`lift`, `num`, `text-title-*`, `bg-overlay`). El detalle está en
`docs/tecnica/design-v2.md` del frontend, sección «Volver a v1».
