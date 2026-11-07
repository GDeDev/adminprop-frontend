/**
 * Mapa de OpenStreetMap para la ficha: sin API key, ni librería, ni cookies. Las
 * URLs se arman acá con números ya validados (nunca con texto de la
 * inmobiliaria), así que lo único que llega a un `src` o un `href` es un
 * `https://www.openstreetmap.org/…` con dos coordenadas.
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/** Origen del embed: es lo que la CSP del sitio permite en `frame-src`. */
export const OSM_ORIGIN = "https://www.openstreetmap.org"

/**
 * Coordenadas válidas o `null`. Acepta números (lo que manda la API) y descarta
 * cualquier otra cosa: `null`, strings, NaN, fuera de rango, y (0, 0) — el
 * "null island" que aparece cuando un dato faltante se guarda como cero.
 */
export function parseCoordinates(
  latitude: unknown,
  longitude: unknown
): Coordinates | null {
  if (typeof latitude !== "number" || typeof longitude !== "number") return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  if (latitude === 0 && longitude === 0) return null
  return { latitude, longitude }
}

const fixed = (value: number) => value.toFixed(6)

/** URL del mapa embebible con un marcador (`export/embed.html`). */
export function osmEmbedUrl({ latitude, longitude }: Coordinates): string {
  // ~500 m a cada lado: un barrio, lo bastante cerca para ubicar la calle.
  const delta = 0.005
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ]
    .map(fixed)
    .join(",")
  return `${OSM_ORIGIN}/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${fixed(latitude)}%2C${fixed(longitude)}`
}

/** Link para abrir el mapa en OpenStreetMap (pestaña nueva). */
export function osmLink({ latitude, longitude }: Coordinates): string {
  return `${OSM_ORIGIN}/?mlat=${fixed(latitude)}&mlon=${fixed(longitude)}#map=16/${fixed(latitude)}/${fixed(longitude)}`
}
