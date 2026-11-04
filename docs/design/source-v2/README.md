# Qué llevar a `adminprop-repo-files`

Esta carpeta es la fuente del diseño v2 ya aprobado, lista para copiar al repo de
lineamientos (`../adminprop-repo-files/packages-ui-source/`). Este repo no toca
`adminprop-repo-files`: la copia la hace una persona.

| Archivo de acá             | Va a (`adminprop-repo-files/`)                | Qué hacer                                                                                                            |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ADMINPROP-UI-v2.md`       | `packages-ui-source/ADMINPROP-UI.md`          | Reemplazar el archivo (renombrar a `ADMINPROP-UI.md`).                                                               |
| `adminprop-v2.css`         | `packages-ui-source/adminprop-v2.css`         | Agregar. Reemplaza a `globals.css` como fuente de los tokens; borrar `globals.css` o dejarlo marcado como histórico. |
| `adminprop-v2-effects.css` | `packages-ui-source/adminprop-v2-effects.css` | Agregar (utilidades de superficie, efecto y movimiento).                                                             |

Además, en el `CLAUDE.md` de `adminprop-repo-files` (sección «Sistema de Diseño»):

- Cambiar las fuentes: **Bricolage Grotesque** (display) + **Geist** (cuerpo) +
  **Geist Mono**, vía `next/font/google`, en lugar de Outfit + Figtree.
- Apuntar a `adminprop-v2.css` y `adminprop-v2-effects.css` en lugar de
  `globals.css`.
- Agregar que los montos van en `font-display num` y los KPIs en `StatCard`, y
  que `AiBadge` / `Button variant="ai"` / `Badge variant="ia"` solo marcan lo que
  sugirió el sistema.
- La regla «`accent` es el cobre, el hover es `muted`» y el tema por tenant
  (`--primary`) no cambian.

Las copias de los CSS de esta carpeta son textuales de
`packages/ui/src/styles/`: si se edita uno, copiar el otro al mismo tiempo.
