# Diseño v2 — qué cambia para quien usa el sistema

Propuesta de rediseño visual de Adminprop ("Cobre sobre tinta"). No cambia
ninguna regla de negocio, ningún dato ni ninguna pantalla nueva: cambia cómo se
ve y cómo se mueve lo que ya existe. Hasta que se apruebe, no se reemplaza nada.

## Para quien administra (backoffice)

- **Más profundidad.** Las tarjetas, tablas y menús tienen capas: una sombra
  suave, un borde fino y un destello de luz arriba, en lugar de rectángulos
  planos. En modo oscuro las superficies suben de tono según su nivel.
- **Letras nuevas.** Títulos y cifras en Bricolage Grotesque (más carácter);
  el resto en Geist (más nítida en tamaños chicos). Los montos siguen
  alineados a la derecha y con cifras de ancho fijo.
- **Botones vivos.** El botón principal tiene un degradé sutil y un halo al
  pasar el mouse; todos los botones responden al toque con un pequeño «hundido».
- **Movimiento con medida.** Las pantallas entran con un fundido corto, las
  listas cortas aparecen de a una, los esqueletos de carga tienen un barrido de
  luz y los KPI cuentan hasta su valor. Si el sistema operativo pide «reducir
  movimiento», no se mueve nada.
- **Buscar con teclado.** `Ctrl+K` (o `⌘K`) abre una paleta para ir a
  cualquier sección; también hay un botón «Buscar» en el menú lateral y en la
  barra superior del celular.
- **Todo lo que sugiere el sistema se distingue.** Un destello violeta-cobre y
  la etiqueta «IA» marcan lo generado o sugerido automáticamente (por ejemplo,
  la tasación sugerida). Lo que cargó una persona no lo lleva.
- **Más legible.** Se revisó el contraste de todos los pares de texto y fondo
  en claro y oscuro; el texto secundario, que antes quedaba bajo el mínimo
  recomendado, ahora lo cumple. Los botones, pestañas y campos miden 44 px de
  alto en el celular.

## Para cada inmobiliaria

- Sigue cambiando **solo el color principal** (`primary`). El degradé del
  botón, el halo, los héroes y los fondos suaves se calculan a partir de ese
  color, así que acompañan a la marca de cada inmobiliaria sin configuración
  extra.
- Un color de marca de luminosidad media (ni claro ni oscuro) puede dejar el
  texto del botón apenas por debajo de lo recomendado (3.96:1 en el peor caso
  medido). Conviene validar el color cuando se carga.

## Para inquilinos y propietarios (portal)

- El sitio público tiene un encabezado con un resplandor cobre, un bloque de
  presentación con fondo suave, y las propiedades entran de a una; las
  tarjetas se elevan un poco al pasar el mouse y la foto hace un zoom leve.
- Las pantallas de ingreso (backoffice y portales) suman el mismo resplandor.

## Para quien desarrolla

- Los nombres de los colores (`primary`, `accent`, `muted`, `*-soft`…) **no
  cambian**; las pantallas existentes funcionan sin tocarlas.
- Componentes nuevos disponibles: `AiBadge`, `StatCard`, `GradientSurface`,
  `AnimatedList`, `CommandPalette`; variantes nuevas `Button variant="ai"` y
  `Badge variant="ia"`.
- La vitrina `/design-system` (solo desarrollo) muestra todo en claro y en
  oscuro.
- Reglas completas: `docs/design/source-v2/ADMINPROP-UI-v2.md`.
