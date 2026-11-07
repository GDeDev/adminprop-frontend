/** Anchos que se le ofrecen al navegador para elegir según `sizes`. */
export const SRCSET_WIDTHS = [320, 640, 960, 1280, 1920] as const

// Solo URLs de Cloudinary sin transformaciones propias (`upload/v123/…`): ahí
// se puede pedir otro ancho sin cambiar la imagen. Con transformaciones ya
// puestas (recortes, etc.) o de otro storage, no se arma `srcSet`.
const CLOUDINARY =
  /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/[^?#]+)$/

/**
 * `srcSet` de una foto de Cloudinary: la misma imagen a varios anchos
 * (`w_<n>,c_limit`: nunca agranda), en el formato y calidad que mejor le
 * convengan al navegador. `undefined` si la URL no es de Cloudinary o ya trae
 * transformaciones.
 */
export function cloudinarySrcSet(src: string): string | undefined {
  const match = CLOUDINARY.exec(src)
  if (!match) return undefined
  const [, base, rest] = match
  return SRCSET_WIDTHS.map(
    (w) => `${base}w_${w},c_limit,f_auto,q_auto/${rest} ${w}w`
  ).join(", ")
}
