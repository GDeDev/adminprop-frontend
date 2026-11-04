# QA visual del diseño v2

Rama `fix/visual-qa-design-v2` (sobre `feature/design-v2`). Se revisó con Chromium (Playwright) contra `next dev`, a 375, 768 y 1280 px, en claro y oscuro, más axe-core (WCAG 2.x A/AA y buenas prácticas) y un recorrido por teclado. Capturas en `docs/design/capturas-qa/`.

## Cómo se revisó (y el límite que eso pone)

- Backoffice en `:3001` y portal en `:3002`, con la cookie `adminprop_bo_rt=x`.
- No hay API real. Se levantó una API falsa descartable (fuera del repo) que contesta `/auth/refresh`, `/auth/me`, `/tenants/current`, los maestros, `/reports/dashboard`, `/crm/pipeline`, y listas de propietarios y propiedades con 3 filas. **Todo lo demás devuelve una lista vacía**, y varias pantallas esperan otra forma y fallan al renderizar (ver "Pendiente").
- Las medidas de "área táctil" son el rectángulo del elemento. Los arreglos con pseudo-elemento (switch, checkbox, radio, `xs`) agrandan el área de toque sin cambiar el rectángulo, así que el script los sigue contando como chicos; se verificaron por clases y por prueba, no por clic en dispositivo.

## Qué se arregló (un commit cada uno)

| Qué                                                                                                              | Dónde                      | Prueba                                                 |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------ |
| Borde de inputs/selects/checkbox/radio/botón outline a 3:1 (era ~1.5:1). Token nuevo `--control`, claro y oscuro | `packages/ui`              | `contrast.test.ts` (2 pares nuevos)                    |
| Dashboard con scroll horizontal en 375 (695 px de ancho por una dirección larga)                                 | `dashboard-overview.tsx`   | captura antes/después; `scrollWidth - clientWidth = 0` |
| Pestañas inactivas con 4.41:1 en claro; altura táctil < 44 px                                                    | `tabs.tsx`                 | axe sin `color-contrast` en maestros                   |
| Botones `sm`, `icon-sm`, `icon-lg` a 44 px bajo `md`; `xs`/`icon-xs` con área táctil extendida                   | `button.tsx`               | `button.test.tsx`                                      |
| Botón con `loading` (spinner, deshabilitado, `aria-busy`)                                                        | `button.tsx`               | `button.test.tsx`                                      |
| Toasts: suben por encima del BottomNav + safe-area; descripción con `muted-foreground`                           | `sonner.tsx`               | medido: 76 px del borde inferior, 12 px a cada lado    |
| `prefers-reduced-motion` también para `animate-pulse`, `animate-in/out` y toasts                                 | `adminprop-v2-effects.css` | no hay prueba automática                               |
| Switch, Checkbox, RadioGroup: área táctil de 44 px bajo `md`                                                     | `ui`                       | solo por clases                                        |
| Links de breadcrumb y marca del header a 44 px; ThemeToggle ya no se achica                                      | `ui`, backoffice           | axe/medición                                           |
| Foco por teclado invisible en las filas de tabla cuyo link las cubre (5 listados)                                | `table.tsx`                | `table.test.tsx` + captura                             |
| Sin `error.tsx` ni `not-found.tsx`: un fallo o URL mala mostraba la página pelada de Next                        | backoffice y portal        | captura del error dentro del shell                     |
| Login sin `<h1>` (backoffice y portal)                                                                           | logins                     | axe                                                    |

## Checklist por pantalla

Leyenda: **R** revisado, **A** arreglado, **P** pendiente / no se pudo ver bien.

### Backoffice

| Pantalla                                                             | 375       | 768 | 1280 | Claro/oscuro | Notas                                         |
| -------------------------------------------------------------------- | --------- | --- | ---- | ------------ | --------------------------------------------- |
| `/login`                                                             | R, A      | R   | R    | R            | borde de inputs, h1                           |
| `/design-system`                                                     | R, A      | R   | R    | R            | ver hallazgos abajo                           |
| `/dashboard`                                                         | R, A      | R   | R    | R            | desborde en mobile arreglado; datos simulados |
| `/propiedades` (lista)                                               | R         | R   | R    | R            | con 3 filas; foco de fila arreglado           |
| `/propietarios`                                                      | P         | P   | P    | P            | falla al renderizar con la API falsa          |
| `/inquilinos`, `/contratos`                                          | R (vacío) | R   | R    | R            | solo estado vacío                             |
| `/cobros`, `/liquidaciones`, `/crm`, `/perfil`, `/propiedades/nueva` | P         | P   | P    | P            | fallan al renderizar con la API falsa         |
| `/reportes`, `/configuracion`, `/configuracion/usuarios`             | R (vacío) | R   | R    | R            |                                               |
| `/configuracion/maestros`                                            | R, A      | R   | R    | R            | pestañas: contraste y altura                  |
| Error de render / 404                                                | R, A      | -   | -    | R            | pantalla nueva; error visto en 375 oscuro     |

### Portal

| Pantalla                                 | 375  | 1280 | Claro/oscuro | Notas              |
| ---------------------------------------- | ---- | ---- | ------------ | ------------------ |
| `/`                                      | R, A | R    | R            | link de marca      |
| `/propietario/login`, `/inquilino/login` | R, A | R    | R            | h1 y link de marca |
| 404                                      | R    | R    | R            |                    |

## Hallazgos que quedan abiertos

- **Pantallas que fallan con la API falsa** (propietarios, cobros, liquidaciones, crm, perfil, propiedades/nueva): no se sabe si es por los datos falsos (lo más probable: `Cannot read properties of undefined`) o por un caso real sin manejar. Conviene mirarlas con el backend real.
- **Contraste `animate-glow-pulse` en la vitrina** (AI badge): axe mide 2.65 a 4.19 según el instante porque la opacidad anima de 0.55 a 1. El par estático `ai` sobre `ai-soft` está cubierto por `contrast.test.ts`.
- **El `region`/`landmark-one-main` de axe** (contenido fuera de landmarks) se ignoró en la mayoría de pantallas; no se tocó.
- **`EmptyState` usa `h2`**: en las pantallas de error y 404 no hay `h1`.
- `design-system` (solo desarrollo) conserva botones de 16 px (demos de checkbox/switch sin extender) y de 98x32 ("Reproducir"): es la vitrina, no producto.
- **`apps/sites` no existe en esta rama**, así que no se revisaron los dos templates.

## Qué NO se pudo ver

- Pantallas logueadas con datos reales: detalle (`[id]`), formularios, wizard de contrato, liquidaciones, cobros, CRM (tablero), reportes con datos.
- Diálogos y Drawers abiertos (solo hay pruebas unitarias de `ResponsiveDialog`), menús, paleta de comandos, el "Más" del BottomNav.
- Tablas con muchas columnas en mobile (solo la lista de propiedades, que cambia a tarjetas).
- Estados de carga reales (skeleton) y de error de red por pantalla.
- El toast sobre el BottomNav real: se midió en la vitrina, que no tiene BottomNav. El 76 px = 4rem de la barra + 12 px; la altura de la barra se tomó del código (`min-h-16`).
- Hover/disabled/loading de cada botón en uso real; `prefers-reduced-motion` no se verificó con una aserción.
- Dispositivos reales, Safari/WebKit y Firefox (solo Chromium), safe-area en un iPhone real, teclado virtual.
- Contraste con colores de inmobiliaria distintos del predeterminado (lo cubren los tests de tema, no se vio en pantalla).
- Por limitaciones de captura, la imagen "después" del dashboard es solo el viewport; la "antes" es la página completa.
