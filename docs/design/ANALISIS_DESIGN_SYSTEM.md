# Análisis del sistema de diseño actual y dirección v2

Rama `feature/design-v2`. Pedido del dueño: "analizar todo el design system y
mejorarlo con el mejor estilo visual del mercado 2026, un estilo bien IA, con
buenos colores, tipografías, efectos, animaciones, etc. No quiero un software
anticuado y aburrido."

Este documento audita lo que hay (v1) y justifica la dirección elegida (v2).
Las capturas de "antes" están en `docs/design/capturas/antes/`.

## 1. Qué hay hoy (v1)

| Capa        | Estado actual                                                                                                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens      | `packages/ui/src/styles/adminprop.css`: ~35 colores en hex, planos, con un único nivel de superficie (`card` blanco sobre `background` crema). Tres sombras (`sm/md/lg`) de una sola capa. Cuatro radios (8/12/16/20). |
| Tipografía  | Outfit (display) + Figtree (cuerpo). Sin escala definida: cada pantalla elige `text-2xl`, `text-3xl`. Los montos usan `tabular-nums` solo si alguien se acuerda.                                                       |
| Color       | Marino `#16304f` + cobre `#c2703a` + crema. Estados con pares `*-soft`/base. Modo oscuro azul-tinta correcto.                                                                                                          |
| Componentes | ~40 de shadcn/ui (new-york) ajustados (`hover:bg-muted`), más `AppSidebar`, `BottomNav`, `EmptyState`, `ResponsiveDialog`, `PageSkeleton`.                                                                             |
| Movimiento  | `tw-animate-css` para dialogs; `animate-pulse` en `Skeleton`; `transition-all` suelto en botones. Nada coreografiado.                                                                                                  |
| Layout      | Backoffice: sidebar oscuro de 248 px + barra superior mobile + `BottomNav`. Portal: header oscuro de 56 px y contenido centrado en `max-w-6xl`.                                                                        |
| Vitrina     | `/design-system` (solo dev): lista vertical de secciones sin tokens de tipografía, elevación ni movimiento; hasta ahora vivía dentro del `SessionGate`, lo que impedía verla sin API.                                  |

## 2. Qué se ve anticuado o plano

Mirando las capturas `antes/`:

1. **Todo está en un solo plano.** Tarjeta blanca, borde gris sólido, sombra casi invisible. No hay jerarquía de profundidad: una card, un popover y un diálogo se distinguen por poco más que el tamaño.
2. **Bordes opacos.** Los bordes son hex sólidos; sobre superficies distintas (crema, blanco, popover) se ven duros o desaparecen. El patrón actual es borde con transparencia de 1 px (se adapta a lo que hay debajo) más un reborde de luz interno en oscuro.
3. **Sin atmósfera.** Fondos lisos. No hay gradientes, glow, ni un solo punto de énfasis visual: el botón primario es un rectángulo marino sin relieve, sin foco "vivo".
4. **El modo oscuro es un "invertido".** Funciona, pero las superficies no suben de luminosidad con la elevación y el contraste de los bordes es el mismo que en claro.
5. **Movimiento ausente.** Estados vacíos y listas aparecen de golpe; el skeleton es un `pulse` genérico; no hay feedback táctil (press), ni entrada escalonada, ni contadores en los KPIs del dashboard.
6. **Tipografía sin carácter ni escala.** Outfit funciona pero es la fuente de "todo SaaS 2022"; los títulos no tienen tracking negativo ni optical sizing; no existe una escala nombrada, así que cada pantalla improvisa.
7. **Nada comunica "asistido por IA".** La Fase 24 (tasación automática) y el CRM traen sugerencias generadas, pero no hay lenguaje visual para distinguirlas de un dato cargado a mano.
8. **Chrome oscuro plano.** Sidebar y header del portal son un bloque navy liso; el ítem activo solo cambia el color del ícono.

## 3. Qué funciona y se conserva

- **La paleta de marca**: marino + cobre + papel cálido tiene identidad (confianza + calidez) y diferencia de los SaaS azul-violeta genéricos. Se conserva el _tono_, no los hex.
- **Los nombres de token** (`primary`, `accent`, `muted`, `*-soft`, `sidebar*`): las apps los usan en cientos de lugares. Todos se mantienen.
- **El contrato de tema por inmobiliaria**: solo `--primary`/`--primary-foreground` desde el server. Se mantiene tal cual y se extiende: todo derivado nuevo (glow, degradé, anillos) se calcula con `color-mix()` sobre `--primary`, así sigue al tenant.
- **Reglas de producto**: `muted` es el hover, `accent` es marca; mobile primero; Drawer en mobile; skeleton con la forma del contenido; montos en tabulares y a la derecha; chrome oscuro no es tema.
- **Las APIs públicas de los componentes** (props, variantes de `Badge`, slots).

## 4. Inconsistencias y deuda detectadas

- `design-rules.test.ts` solo mira cuatro reglas por regex; no hay test de contraste, y el tema por tenant se calcula con una fórmula propia (`prefersLightForeground`) que nunca se contrasta contra los tokens.
- `muted-foreground` (`#6b7484`) sobre `muted` (`#e8e6df`) da 3.77:1 sobre `muted` y 4.17:1 sobre `background` (calculado), y `accent-foreground` sobre `accent` da 3.49:1: no cumplen AA para texto normal. Se corrige en v2 y queda cubierto por test.
- El focus ring de `Input`/`Select` usa `ring/50`; con un primary claro (el tenant "Amarillo" de la vitrina) el anillo casi no se ve.
- `Dialog` usa `bg-black/50` (un color fijo) y el botón de cierre dice "Close" en inglés.
- `transition-all` en el botón: anima propiedades de layout innecesarias.
- `Skeleton`, `Card` y `Table` no comparten ritmo (padding 24 / 8 / 8).
- El `Toaster` usa `--radius` y `popover` pero no el borde/elevación del resto.
- Targets de 44 px solo en `Button`/`Input`/`Select`; tabs (36 px), switch y checkbox quedan chicos en mobile.
- La vitrina estaba dentro del `SessionGate`: sin API no se podía abrir (se movió fuera del grupo `(dashboard)`, sigue siendo 404 en producción).

## 5. Referencias de mercado 2026 (patrones, no marcas)

Lo que comparten las interfaces de punta (herramientas de producto tipo Linear, plataformas de deploy, lanzadores tipo Raycast, navegadores tipo Arc, editores tipo Notion, fintech tipo Stripe, constructores tipo Framer):

| Patrón                                       | Qué hace                                                                                                                                                                                                              | Cómo entra en v2                                                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **OKLCH**                                    | Paletas perceptualmente uniformes: mismas luminosidades en todos los matices, `color-mix` predecible, modo oscuro derivado sin sorpresas.                                                                             | Todos los tokens v2 están en `oklch()`. El test de contraste los convierte a sRGB.                                                     |
| **Superficies en capas**                     | 3 a 4 niveles de superficie (fondo, card, raised, popover) con borde de 1 px translúcido y sombra de varias capas (contacto + ambiente). En oscuro, la elevación sube la luminosidad y suma un reborde de luz arriba. | `--surface-*`, `--shadow-1..4`, `--border` con alfa, `.surface-raised`.                                                                |
| **Degradés y mesh sutiles**                  | Fondos con 2 a 3 manchas de color de muy baja opacidad detrás del contenido principal; degradés en el CTA principal.                                                                                                  | `.bg-mesh` (hero, login, estados vacíos) y `GradientSurface`; la marca viene de `--primary`, entonces cambia con el tenant.            |
| **Glow controlado**                          | Un halo de color alrededor del elemento de máxima prioridad (CTA, foco, activo), no de todos.                                                                                                                         | Anillo de foco con halo, `.glow-primary` solo en el botón por defecto y en el ítem activo del sidebar.                                 |
| **Glassmorphism medido**                     | Blur solo en elementos flotantes y chicos (header sticky, popover, bottom-nav), nunca en listas.                                                                                                                      | `.glass` con `backdrop-filter` limitado a header mobile, `BottomNav`, `CommandPalette` y overlays. Prohibido en filas de tabla/listas. |
| **Bento grid**                               | Dashboards de tarjetas de distinto tamaño con una tarjeta héroe.                                                                                                                                                      | `BentoGrid` (utilidad CSS) para el dashboard y la vitrina.                                                                             |
| **Tipografía variable con jerarquía fuerte** | Un display con carácter para títulos y cifras grandes, un cuerpo neutro y legible, números tabulares, tracking negativo en tamaños grandes.                                                                           | Escala `text-display-*` nombrada, tracking por nivel, `tabular-nums` automático en `.num`.                                             |
| **Micro-interacciones**                      | Press (`scale .98`), hover que levanta 1 px, íconos que reaccionan, resortes cortos.                                                                                                                                  | `.pressable`, `ease-spring`, solo `transform` y `opacity`.                                                                             |
| **Skeleton con shimmer**                     | Barrido de luz en lugar de pulso.                                                                                                                                                                                     | `Skeleton` con shimmer por `transform` (un pseudo-elemento) y fallback estático con reduced-motion.                                    |
| **Contadores animados**                      | Las cifras de KPI cuentan hasta su valor al entrar.                                                                                                                                                                   | `StatCard` + `useCountUp` (rAF, sin librería), respeta reduced-motion.                                                                 |
| **Command palette**                          | `⌘K` para navegar y ejecutar.                                                                                                                                                                                         | `CommandPalette` sobre `cmdk`, que ya es dependencia.                                                                                  |
| **Sparkle de IA**                            | Un símbolo de destello y un degradé violeta-cobre marcan lo generado o sugerido por IA.                                                                                                                               | `AiBadge`, `AiSparkle`, token `--ai` y `.ai-border` (borde degradé).                                                                   |

## 6. Dirección elegida: "Cobre sobre tinta"

Una sola dirección, coherente para una inmobiliaria argentina:

1. **Concepto.** Confianza financiera + modernidad de herramienta de IA. La base sigue siendo _tinta marina y papel cálido_ (lo serio: contratos, plata, liquidaciones); la modernidad viene de la profundidad, la luz y el movimiento, no de cambiar de identidad. Un violeta-índigo acotado aparece solo para lo asistido por IA.
2. **Color (OKLCH).** Papel `oklch(0.978 0.006 85)`, tinta `oklch(0.2 0.03 258)`, marino `oklch(0.34 0.085 258)` como primary, cobre `oklch(0.7 0.15 52)` como acento de marca (más luminoso que v1: pasa a funcionar como "luz"), violeta `--ai` `oklch(0.5 0.2 285)` para IA. Oscuro: tinta profunda `oklch(0.16 0.02 262)`, superficies que suben de luminosidad con la elevación, primary azul eléctrico claro. Estados con pares soft/base re-derivados a luminosidad pareja.
3. **Tipografía.** _Bricolage Grotesque_ (variable, con optical size y eje de ancho) para títulos y cifras: tiene personalidad editorial sin perder seriedad; _Geist_ para cuerpo e interfaz (diseñada para UI, excelente a 13-15 px, tabulares nativos); _Geist Mono_ para códigos y datos técnicos. Escala nombrada de 12 a 48 px con tracking negativo en los grandes. Fallback de sistema funcional.
4. **Forma y elevación.** Radios 6/10/14/20/28 (más cerrados en controles, más generosos en superficies). Bordes de 1 px translúcidos. Elevación en 4 niveles: sombras de dos o tres capas con tinte de la tinta (no negro puro), más reborde de luz interno en oscuro.
5. **Movimiento.** Duraciones 120/200/320/500 ms; `ease-out-expo` para entradas, un resorte corto (`linear()`) para press y toggles; entrada escalonada de listas (30 ms por ítem, tope 8); solo `transform` y `opacity`; todo desactivado con `prefers-reduced-motion`. Sin librerías de animación.

### Reglas de uso (resumen; el detalle está en `source-v2/ADMINPROP-UI-v2.md`)

- Un solo elemento "glow" por pantalla (el CTA principal).
- Blur (`.glass`) solo en superficies flotantes pequeñas; nunca en filas de listas ni tablas.
- El degradé de IA solo marca contenido generado/sugerido; no se usa como decoración.
- Animar `transform` y `opacity`; nunca `width`, `height`, `top`, `left`, ni `filter: blur()` animado.
- Los montos siguen siendo strings de la API: se formatean, no se calculan (el contador animado interpola solo la presentación y termina siempre en el string exacto).
- Todo color sale de un token; los derivados usan `color-mix()` sobre tokens para respetar el tema por inmobiliaria.

## 7. Qué no se hace (y por qué)

- **No se agrega una librería de animación** (Motion/GSAP, 30-100 kB). CSS + un hook de 30 líneas cubren el alcance. Reevaluar solo si se piden transiciones compartidas entre rutas.
- **No se toca `apps/sites`** (no existe en esta rama; los sitios por inmobiliaria con tema propio por variables CSS son de otra línea de trabajo). Propuesta en el doc técnico: que importen `adminprop-v2.css` y sobrescriban únicamente `--primary`.
- **Transiciones de vista entre rutas**: queda la propuesta de usar la View Transitions API (`@view-transition`) y el `<ViewTransition>` de React; en esta entrega solo se incluye la entrada de página por CSS porque la integración con el router de Next es experimental.
