import type { HostResult } from "./api"

const HIT_TTL_MS = 30_000
const MISS_TTL_MS = 10_000
/** Un valor viejo se sigue usando hasta este tiempo si la API no responde. */
const STALE_MAX_MS = 10 * 60_000
const MAX_ENTRIES = 2_000

interface Entry {
  slug: string | null
  expires: number
  storedAt: number
}

const cache = new Map<string, Entry>()

/** La API no pudo decir si el host existe y no hay un valor viejo que usar. */
export class HostLookupError extends Error {
  constructor(host: string) {
    super(`No se pudo resolver el host ${host}`)
    this.name = "HostLookupError"
  }
}

/**
 * Host → slug con caché en memoria y TTL corto (los "no existe" duran menos).
 *
 * Distingue "no existe" de "la API falló" (por ejemplo, un 429 por tráfico
 * ajeno): ante una falla NO se cachea un "no existe", se sigue sirviendo el
 * último valor conocido (hasta 10 minutos) y, si no hay ninguno, se lanza
 * `HostLookupError` para que el proxy responda 503 en vez de 404.
 */
export async function cachedHostLookup(
  host: string,
  lookup: (host: string) => Promise<HostResult>
): Promise<string | null> {
  const key = host.toLowerCase().replace(/:\d+$/, "")
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expires > now) return hit.slug

  const result = await lookup(key)
  if (result.status === "error") {
    if (hit && now - hit.storedAt < STALE_MAX_MS) return hit.slug
    throw new HostLookupError(key)
  }

  const slug = result.status === "found" ? result.slug : null
  if (cache.size >= MAX_ENTRIES) cache.clear()
  cache.set(key, {
    slug,
    storedAt: now,
    expires: now + (slug ? HIT_TTL_MS : MISS_TTL_MS),
  })
  return slug
}

/** Olvida todo (al recibir un aviso de publicación y en los tests). */
export function clearHostCache(): void {
  cache.clear()
}
