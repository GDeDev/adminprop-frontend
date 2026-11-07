import { isIP } from "node:net"

/**
 * IP del visitante para el límite de consultas de la API.
 *
 * `X-Forwarded-For` lo puede escribir cualquiera: el primer valor es el que
 * mandó el cliente, así que NO se usa. Se toma, en este orden:
 * 1. el header que fije `SITES_CLIENT_IP_HEADER` (el que la plataforma
 *    garantiza: `x-real-ip`, `cf-connecting-ip`, `x-vercel-forwarded-for`…);
 * 2. el valor de `X-Forwarded-For` que agregó nuestro proxy más cercano, es
 *    decir, contando desde la derecha: `SITES_TRUSTED_PROXY_HOPS` (default 1).
 * En producción (`NODE_ENV=production`) el paso 2 NO se usa: sin el header
 * configurado no se manda IP.
 * Si no hay una IP válida, `null` (la API cuenta por el servidor).
 */
export function clientIp(
  headers: { get(name: string): string | null },
  env: Record<string, string | undefined> = process.env
): string | null {
  const valid = (value: string | null | undefined): string | null => {
    const ip = value?.trim() ?? ""
    return isIP(ip) ? ip : null
  }

  const custom = env.SITES_CLIENT_IP_HEADER?.trim().toLowerCase()
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
  const hops = Math.max(1, Number(env.SITES_TRUSTED_PROXY_HOPS ?? 1) || 1)
  return valid(parts[parts.length - hops])
}
