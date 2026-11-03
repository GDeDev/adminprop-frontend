// Vista previa del borrador: el mismo sitio, pero renderizado en cada pedido.
// Lo publicado (`/s/…`) se cachea con ISR; el borrador no puede cachearse, y un
// `fetch` sin caché dentro de una ruta con ISR hace que Next falle. Por eso la
// vista previa vive en su propio árbol, que reusa las mismas páginas.
export const dynamic = "force-dynamic"

export { default, generateMetadata } from "../../s/[site]/layout"
