import { isIP } from "node:net"

/**
 * IP del usuario que llega al BFF, para que la API limite por persona y no por
 * este servidor. Misma regla que `apps/sites/src/lib/client-ip.ts`:
 * `X-Forwarded-For` lo escribe cualquiera, así que se toma el header que fije
 * `CLIENT_IP_HEADER` (el que garantiza la plataforma) o el valor que agregó
 * nuestro proxy más cercano contando desde la derecha (`TRUSTED_PROXY_HOPS`,
 * default 1). Sin una IP válida, `null`.
 */
export function clientIp(
  headers: { get(name: string): string | null },
  env: Record<string, string | undefined> = process.env
): string | null {
  const valid = (value: string | null | undefined): string | null => {
    const ip = value?.trim() ?? ""
    return isIP(ip) ? ip : null
  }

  const custom = env.CLIENT_IP_HEADER?.trim().toLowerCase()
  if (custom) return valid(headers.get(custom))

  // En producción, sin un header que fije la plataforma, el último
  // `X-Forwarded-For` lo puede elegir el cliente si nadie por delante lo
  // agrega: no se declara IP (la API cuenta por este servidor). En desarrollo
  // se mantiene el comportamiento.
  if (env.NODE_ENV === "production") return null

  const parts = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  const hops = Math.max(1, Number(env.TRUSTED_PROXY_HOPS ?? 1) || 1)
  return valid(parts[parts.length - hops])
}
