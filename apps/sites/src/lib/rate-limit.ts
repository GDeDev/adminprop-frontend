/**
 * Límite por IP de los pedidos que el proxy deja llegar a la API sin caché:
 * resolver un host que no está en memoria y la vista previa del borrador.
 *
 * Esas lecturas son `no-store` y salen todas desde la IP de este servidor, así
 * que sin un tope acá un solo visitante (con `Host` inventados o tokens con
 * forma de JWT) las multiplica contra la API. Lo cacheado no cuenta: navegar un
 * sitio publicado no gasta cupo.
 *
 * Ventana fija en memoria, por instancia: es un freno contra un abusador, no
 * una cuota exacta. Sin IP confiable (`clientIp` da `null`, típicamente en
 * desarrollo) no se limita: un balde compartido frenaría a todos juntos.
 */
export const RATE_LIMIT_WINDOW_MS = 60_000
/** Holgado para la vista previa: el iframe precarga los links de la página. */
export const RATE_LIMIT_MAX = 120
const MAX_TRACKED_IPS = 10_000

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** `true` si la IP todavía tiene cupo (y lo descuenta). */
export function takeToken(ip: string | null, now = Date.now()): boolean {
  if (!ip) return true
  let bucket = buckets.get(ip)
  if (!bucket || bucket.resetAt <= now) {
    buckets.delete(ip)
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    buckets.set(ip, bucket)
    while (buckets.size > MAX_TRACKED_IPS) {
      const oldest = buckets.keys().next().value
      if (oldest === undefined) break
      buckets.delete(oldest)
    }
  }
  bucket.count += 1
  return bucket.count <= RATE_LIMIT_MAX
}

/** Olvida todo (tests). */
export function clearRateLimit(): void {
  buckets.clear()
}
