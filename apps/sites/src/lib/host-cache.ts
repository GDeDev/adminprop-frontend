import type { HostResult } from "./api"

const HIT_TTL_MS = 30_000
const MISS_TTL_MS = 10_000
/** Un valor viejo se sigue usando hasta este tiempo si la API no responde. */
const STALE_MAX_MS = 10 * 60_000
/** Hosts que existen (pocos: uno por sitio publicado). */
const MAX_HITS = 2_000
/**
 * Hosts que no existen. Van aparte para que una ráfaga de `Host` inventados
 * no desaloje a los sitios reales: solo se pisan entre ellos.
 */
const MAX_MISSES = 5_000

interface Entry {
  slug: string | null
  expires: number
  storedAt: number
}

const hits = new Map<string, Entry>()
const misses = new Map<string, Entry>()

/** La API no pudo decir si el host existe y no hay un valor viejo que usar. */
export class HostLookupError extends Error {
  constructor(host: string) {
    super(`No se pudo resolver el host ${host}`)
    this.name = "HostLookupError"
  }
}

/**
 * Hay que consultar la API pero el visitante ya gastó su cupo (ver
 * `rate-limit.ts`). El proxy responde 429.
 */
export class HostLookupLimitedError extends Error {
  constructor(host: string) {
    super(`Demasiadas consultas de host (${host})`)
    this.name = "HostLookupLimitedError"
  }
}

/**
 * LRU sobre el orden de inserción del `Map`: se reinserta al usarla y, si se
 * pasa del tope, sale la más vieja (antes se vaciaba todo, y 2000 hosts
 * inventados alcanzaban para que todos los sitios reales volvieran a la API).
 */
function store(map: Map<string, Entry>, max: number, key: string, e: Entry) {
  map.delete(key)
  map.set(key, e)
  while (map.size > max) {
    const oldest = map.keys().next().value
    if (oldest === undefined) break
    map.delete(oldest)
  }
}

/**
 * Host → slug con caché en memoria y TTL corto (los "no existe" duran menos).
 *
 * Distingue "no existe" de "la API falló" (por ejemplo, un 429 por tráfico
 * ajeno): ante una falla NO se cachea un "no existe", se sigue sirviendo el
 * último valor conocido (hasta 10 minutos) y, si no hay ninguno, se lanza
 * `HostLookupError` para que el proxy responda 503 en vez de 404.
 *
 * `allowLookup` se consulta solo cuando hay que ir a la API (la caché no
 * alcanza): si devuelve `false` se sirve el valor viejo o se lanza
 * `HostLookupLimitedError`.
 */
export async function cachedHostLookup(
  host: string,
  lookup: (host: string) => Promise<HostResult>,
  allowLookup: () => boolean = () => true
): Promise<string | null> {
  const key = host.toLowerCase().replace(/:\d+$/, "")
  const now = Date.now()
  const hit = hits.get(key) ?? misses.get(key)
  if (hit && hit.expires > now) {
    if (hit.slug) store(hits, MAX_HITS, key, hit)
    return hit.slug
  }

  const stale = hit && now - hit.storedAt < STALE_MAX_MS ? hit : null

  if (!allowLookup()) {
    if (stale) return stale.slug
    throw new HostLookupLimitedError(key)
  }

  const result = await lookup(key)
  if (result.status === "error") {
    if (stale) return stale.slug
    throw new HostLookupError(key)
  }

  const slug = result.status === "found" ? result.slug : null
  const entry = {
    slug,
    storedAt: now,
    expires: now + (slug ? HIT_TTL_MS : MISS_TTL_MS),
  }
  if (slug) {
    misses.delete(key)
    store(hits, MAX_HITS, key, entry)
  } else {
    hits.delete(key)
    store(misses, MAX_MISSES, key, entry)
  }
  return slug
}

/** Olvida todo (al recibir un aviso de publicación y en los tests). */
export function clearHostCache(): void {
  hits.clear()
  misses.clear()
}
