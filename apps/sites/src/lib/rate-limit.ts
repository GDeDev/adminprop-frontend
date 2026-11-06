/**
 * Límites por IP que aplica el proxy antes de dejar que un pedido llegue a la
 * API. Dos baldes:
 *
 * - `takeToken` (estricto): lecturas sin caché que dispara cualquiera con un
 *   `Host` inventado o un `?preview=` con forma de JWT. Salen desde la IP de
 *   este servidor y sin `X-Sites-Secret`, así que sin un tope acá un solo
 *   visitante agota el cupo que la API le da a este servidor.
 * - `takeBrowseToken` (holgado): lecturas que arma el visitante y que sí van
 *   con el secreto (la API no las frena): fichas por id, el listado con filtros
 *   y favoritos. ISR las cachea por URL, pero una URL nueva por pedido (ids o
 *   filtros inventados) llegaría siempre a la API.
 *
 * Lo cacheado y repetido (la home, una ficha ya vista) no pasa por el balde
 * estricto. Ventana fija en memoria, por instancia: es un freno contra un
 * abusador, no una cuota exacta. Sin IP confiable (`clientIp` da `null`,
 * típicamente en desarrollo) no se limita: un balde compartido frenaría a
 * todos juntos.
 */
export const RATE_LIMIT_WINDOW_MS = 60_000
/** Holgado para la vista previa: el iframe precarga los links de la página. */
export const RATE_LIMIT_MAX = 120
/** Navegar fichas y filtros: un humano (con precargas) no llega; un scraper sí. */
export const BROWSE_LIMIT_MAX = 300
const MAX_TRACKED_IPS = 10_000

interface Bucket {
  count: number
  resetAt: number
}

function createLimiter(max: number) {
  const buckets = new Map<string, Bucket>()
  return {
    take(ip: string | null, now = Date.now()): boolean {
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
      return bucket.count <= max
    },
    clear: () => buckets.clear(),
  }
}

const strict = createLimiter(RATE_LIMIT_MAX)
const browse = createLimiter(BROWSE_LIMIT_MAX)

/** `true` si la IP todavía tiene cupo estricto (y lo descuenta). */
export const takeToken = (ip: string | null, now?: number) =>
  strict.take(ip, now)

/** `true` si la IP todavía tiene cupo de navegación (y lo descuenta). */
export const takeBrowseToken = (ip: string | null, now?: number) =>
  browse.take(ip, now)

/**
 * Pedidos del sitio público cuya URL la arma el visitante y que llegan a la
 * API con el secreto: `path` es la ruta dentro del sitio (sin `/_s/<slug>`).
 */
export function isVisitorBuiltRead(path: string, hasQuery: boolean): boolean {
  return (
    path.startsWith("/propiedades/") ||
    path === "/api/favoritos" ||
    (path === "/propiedades" && hasQuery)
  )
}

/** Olvida todo (tests). */
export function clearRateLimit(): void {
  strict.clear()
  browse.clear()
}
