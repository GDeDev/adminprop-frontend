# PR: propuesta de rediseño del sistema de diseño (v2, "Cobre sobre tinta")

Rama `feature/design-v2`, sobre `feature/fase-24-tasacion-automatica`. **Es una
propuesta implementada: no hay que mergearla hasta que el dueño la apruebe.**
El sistema actual figura como cerrado y aprobado; el dueño pidió rehacerlo
("el mejor estilo visual del mercado 2026, bien IA… no quiero un software
anticuado y aburrido").

> **Actualización (adopción):** el dueño aprobó la v2 «entera». La rama
> `feat/design-v2-adopcion` la completa: `StatCard` cableado (riesgo 8), paneles,
> tipografía y montos migrados, v1 retirada (riesgo 4: la vuelta atrás ya no es
> un import) y vitrina al día. Detalle en `docs/tecnica/design-v2.md`, sección
> «Adopción en las pantallas», y DT-112.

## Qué se hizo

- **Análisis** del sistema actual y dirección elegida:
  `docs/design/ANALISIS_DESIGN_SYSTEM.md`.
- **Tokens v2** en OKLCH (`adminprop-v2.css` + `adminprop-v2-effects.css`),
  4 niveles de elevación, tokens de movimiento y de IA. `adminprop.css` (v1)
  intacto; se elige con un `@import` en `globals.css`.
- **Tipografías**: Bricolage Grotesque + Geist + Geist Mono (`next/font/google`;
  el build las bajó bien). Outfit/Figtree siguen declaradas sin precarga.
- **Componentes base** restilizados sin cambiar sus APIs: button, card,
  input/textarea/select/checkbox/radio/switch, badge, tabs, table, alert,
  progress, dialog/sheet/drawer, popover/dropdown, skeleton, sonner,
  app-sidebar, bottom-nav, empty-state.
- **Componentes nuevos**: `AiBadge`/`AiSparkle`, `StatCard` (contador animado),
  `GradientSurface`, `AnimatedList`, `CommandPalette`; variantes
  `Button variant="ai"` y `Badge variant="ia"`.
- **Apps**: backoffice (paleta Ctrl+K, header mobile con glass, entrada de
  pantalla, login), portal (header, héroe, listado escalonado, filtros, login).
- **Vitrina** `/design-system` rehecha (tokens, tipografía, elevación, radios,
  movimiento, componentes en tema activo y oscuro) y movida fuera del
  `SessionGate`.
- **Tests**: contraste AA (33 pares × 2 modos), reglas v2, contador, componentes
  nuevos.
- **Docs**: `docs/tecnica/design-v2.md`, `docs/funcional/design-v2.md`,
  DT-107 a DT-111, y la fuente a llevar a `adminprop-repo-files`:
  `docs/design/source-v2/` (tokens, efectos y `ADMINPROP-UI-v2.md`).

## Antes / después

Capturas en `docs/design/capturas/antes/` (sistema actual) y
`docs/design/capturas/` (v2), a 375, 768 y 1280 px, en claro y oscuro:

| Pantalla                  | Antes                                        | Después                                |
| ------------------------- | -------------------------------------------- | -------------------------------------- |
| Vitrina `/design-system`  | `antes/backoffice-vitrina-1280-light.png`    | `backoffice-vitrina-1280-light.png`    |
| Login backoffice          | `antes/backoffice-login-375-dark.png`        | `backoffice-login-375-dark.png`        |
| Portal: listado           | `antes/portal-home-1280-dark.png`            | `portal-home-1280-dark.png`            |
| Portal: ingreso inquilino | `antes/portal-login-inquilino-768-light.png` | `portal-login-inquilino-768-light.png` |

Nota: la vitrina "antes" se tomó con el sistema actual, antes de rehacerla.
**No hay capturas** de las pantallas logueadas del backoffice (dashboard,
listados, fichas) ni del portal logueado: requieren sesión y API. El listado
público del portal se capturó con la API caída (estado vacío, sin tarjetas).

## Cómo probarlo

1. `npm ci`; para el backoffice en desarrollo sin API: cookie
   `adminprop_bo_rt=x` y abrir `/design-system`.
2. Para comparar con v1: en `packages/ui/src/styles/globals.css` cambiar el
   import (ver límites en `docs/tecnica/design-v2.md`).

## Verificado (comandos corridos en esta sesión)

| Comando                             | Resultado                                                    |
| ----------------------------------- | ------------------------------------------------------------ |
| `npm run typecheck`                 | 6/6 tareas OK                                                |
| `npm run lint` (`--max-warnings=0`) | 6/6 tareas OK                                                |
| `npm run format:check`              | OK                                                           |
| `npm test`                          | 421 tests OK (ui 140, backoffice 232, session 30, portal 19) |
| `next build` backoffice y portal    | OK (con `NEXT_PUBLIC_API_URL` falsa, sin doppler)            |

## Riesgos y qué revisar a mano

1. **Todas las pantallas cambian un poco.** Cualquier pantalla que use los
   componentes base cambia de radio (10/14/20 px en vez de 12/16/20), sombras,
   bordes translúcidos y tipografía (otra fuente cambia el ancho del texto:
   revisar títulos largos, botones con texto justo y columnas de tablas).
2. **Tablas más altas y con encabezados apagados** (`h-11`, `py-2.5`, `text-xs`
   gris): puede cambiar la cantidad de filas visibles por pantalla y el alto de
   las tablas de los reportes.
3. **Cifras en `font-display`**: las pantallas que ponían montos con otra clase
   no se actualizaron solas; revisar dashboard, cobros y liquidaciones a ojo.
4. **Vuelta atrás con un solo import es parcial** (ver el doc técnico): los
   componentes tienen clases v2 que v1 no define.
5. **Tema por inmobiliaria**: colores de luminosidad media dan un piso de
   3.96:1 para el texto del botón (no 4.5). Ya pasaba en v1; ahora queda
   medido. Recomendación: validar el color al guardarlo.
6. **Pestañas y selects de 44 px en mobile**: cambia el alto de barras con
   muchas pestañas; revisar que sigan entrando en 375 px.
7. **Diálogos**: el botón de cierre cambia de lugar y de tamaño y su texto
   accesible pasa a «Cerrar» (antes «Close»): si algún test e2e o de la API de
   accesibilidad lo busca en inglés, falla.
8. **`StatCard` y `CommandPalette` no están cableados al dashboard** (solo la
   paleta en `AppShell`): son piezas disponibles, la adopción pantalla por
   pantalla queda para después de aprobar la dirección.
9. **No se probó en dispositivos reales** (rendimiento del blur, resortes,
   Safari/iOS con `linear()` y `color-mix`). `color-mix` y `oklch` necesitan
   navegadores de 2023 en adelante; los tokens no tienen respaldo en hex.
10. **`apps/sites` y Fase 23 (CRM) no se tocaron**; si sus ramas usan clases de
    v1 que cambian (`shadow-md`, `rounded-*`), revisarlas al integrar.
11. **Conflictos esperables**: se tocaron `layout.tsx`, `fonts.ts`,
    `app-shell.tsx` y varios componentes de `packages/ui`. No se resolvió
    nada contra otras ramas.

🤖 Generated with [Claude Code](https://claude.ai/code)

https://claude.ai/code/session_01GhBUKJBqXbBFxfDrfiiXnz
