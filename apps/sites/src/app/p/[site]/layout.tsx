// Vista previa del borrador: el mismo sitio, pero renderizado en cada pedido.
// Lo publicado (`/s/…`) se cachea con ISR; el borrador no puede cachearse, y un
// `fetch` sin caché dentro de una ruta con ISR hace que Next falle. Por eso la
// vista previa vive en su propio árbol, que reusa las mismas páginas.
export const dynamic = "force-dynamic"

// `generateViewport` también: sin él la vista previa perdía el `theme-color` del
// sitio (el color de la barra del navegador del celular) y se veía distinta de
// lo publicado.
export {
  default,
  generateMetadata,
  generateViewport,
} from "../../s/[site]/layout"
