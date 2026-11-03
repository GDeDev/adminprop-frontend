const HIT_TTL_MS = 30_000
const MISS_TTL_MS = 10_000
const MAX_ENTRIES = 2_000

const cache = new Map<string, { slug: string | null; expires: number }>()

/**
 * Host → slug con caché en memoria y TTL corto (los "no existe" duran menos),
 * para no consultar a la API en cada pedido. Un cambio de dominio tarda como
 * mucho el TTL en verse.
 */
export async function cachedHostLookup(
  host: string,
  lookup: (host: string) => Promise<string | null>
): Promise<string | null> {
  const key = host.toLowerCase().replace(/:\d+$/, "")
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.slug

  const slug = await lookup(key)
  if (cache.size >= MAX_ENTRIES) cache.clear()
  cache.set(key, {
    slug,
    expires: Date.now() + (slug ? HIT_TTL_MS : MISS_TTL_MS),
  })
  return slug
}

/** Solo para tests. */
export function clearHostCache(): void {
  cache.clear()
}
