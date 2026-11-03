/** Tamaño máximo de una foto, como en la API (10 MB). */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

/**
 * Separa las fotos que entran de las que superan el límite, para avisar antes
 * de subir (en móvil, perder una subida larga por un rechazo de la API es lo
 * peor). La API tiene la última palabra.
 */
export function splitOversizedPhotos(files: File[]): {
  accepted: File[]
  oversized: File[]
} {
  const accepted: File[] = []
  const oversized: File[] = []
  for (const file of files) {
    ;(file.size > MAX_PHOTO_BYTES ? oversized : accepted).push(file)
  }
  return { accepted, oversized }
}

export const OVERSIZED_PHOTO_MESSAGE = (count: number) =>
  count === 1
    ? "Una foto supera los 10 MB y no se subió."
    : `${count} fotos superan los 10 MB y no se subieron.`
