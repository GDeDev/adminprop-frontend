/**
 * Favoritos del visitante: una lista de ids de propiedad guardada en
 * `localStorage` del navegador, sin cuenta ni cookies. Este módulo es lógica
 * pura (sin React ni `window`) para poder probarla; el store del navegador está
 * en `components/favorites-store.ts`.
 */

/** Tope de favoritos por sitio: acota el almacenamiento, el largo de la URL y del mensaje. */
export const FAVORITES_LIMIT = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Una clave por sitio: en un dominio propio no se mezclan, y por slug tampoco. */
export function favoritesKey(slug: string): string {
  return `adminprop-sites:favorites:${slug}`
}

/** Lo guardado puede estar roto o manipulado: solo pasan ids con forma de UUID, sin repetir. */
export function parseFavorites(raw: string | null | undefined): string[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []
  const seen = new Set<string>()
  for (const item of data) {
    if (typeof item === "string" && UUID.test(item)) {
      seen.add(item.toLowerCase())
    }
  }
  return [...seen].slice(0, FAVORITES_LIMIT)
}

export function serializeFavorites(ids: string[]): string {
  return JSON.stringify(ids.slice(0, FAVORITES_LIMIT))
}

/**
 * Agrega o quita un id. Lo nuevo va primero (lo último que guardaste, arriba).
 * Con la lista llena no se agrega: `full` avisa para decírselo a la persona.
 */
export function toggleFavorite(
  ids: string[],
  id: string
): { ids: string[]; full: boolean } {
  const key = id.toLowerCase()
  if (ids.includes(key)) {
    return { ids: ids.filter((item) => item !== key), full: false }
  }
  if (ids.length >= FAVORITES_LIMIT) return { ids, full: true }
  return { ids: [key, ...ids], full: false }
}

/** Ids de `?ids=a,b` (lista compartida): válidos, sin repetir y acotados. */
export function parseIdsParam(value: string | string[] | undefined): string[] {
  const text = Array.isArray(value) ? value[0] : value
  if (!text) return []
  return parseFavorites(JSON.stringify(text.split(",")))
}

/**
 * Mensaje para compartir por WhatsApp: texto plano (WhatsApp interpreta
 * `*negrita*` y `_cursiva_`, así que no se usan) y solo links `https`. Con el
 * origen en `http` (desarrollo) se omiten los links en vez de mandar uno roto.
 */
export function favoritesShareText({
  siteName,
  items,
  origin,
  basePath,
  ids,
}: {
  siteName: string
  items: { id: string; title: string; price: string }[]
  /** `location.origin` del sitio. */
  origin: string
  /** Prefijo de los links internos (`/_s/slug` en desarrollo, vacío por host). */
  basePath: string
  ids: string[]
}): string {
  const secure = origin.startsWith("https://")
  const lines = [`Propiedades que me gustaron en ${siteName}:`, ""]
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.title} - ${item.price}`)
    if (secure) lines.push(`${origin}${basePath}/propiedades/${item.id}`)
  })
  if (secure && ids.length > 0) {
    lines.push(
      "",
      `Ver la lista completa: ${origin}${basePath}/favoritos?ids=${ids.join(",")}`
    )
  }
  return lines.join("\n")
}
