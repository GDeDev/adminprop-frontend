const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const SUBDOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{1,61})[a-z0-9]$/
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/

/** Host en minúsculas, sin puerto ni punto final. */
export function normalizeHost(raw: string): string {
  return raw.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "")
}

/** El dominio base de los subdominios (`SITES_BASE_DOMAIN`), normalizado; `null` si no hay. */
export function baseDomain(
  env: Record<string, string | undefined> = process.env
): string | null {
  const value = normalizeHost(env.SITES_BASE_DOMAIN ?? "")
  return value || null
}

/** Nombre de dominio completo: al menos dos etiquetas válidas, no una IP, no `localhost`. */
function isFullDomain(host: string): boolean {
  if (host.length > 253) return false
  const labels = host.split(".")
  return (
    labels.length >= 2 &&
    labels.every((label) => LABEL.test(label)) &&
    !IPV4.test(host) &&
    !/^\d+$/.test(labels[labels.length - 1] ?? "") &&
    host !== "localhost" &&
    !host.endsWith(".localhost")
  )
}

/**
 * ¿Vale la pena preguntarle a la API por este host? Evita inundarla con
 * nombres que jamás podrían ser un sitio: pasa solo
 * - `<subdominio>.<SITES_BASE_DOMAIN>` con UN nivel y una etiqueta válida, o
 * - un dominio propio con forma de dominio (no IP, no `localhost`, no colgado
 *   del dominio base: ese espacio se reparte con subdominios).
 * Lo demás se descarta sin llamar a la API. Un subdominio al azar con forma
 * válida sí pasa (solo la API sabe si existe); esos los frena la caché de
 * fallos y el tope de la API.
 */
export function isPlausibleSiteHost(
  rawHost: string,
  base: string | null = baseDomain()
): boolean {
  const host = normalizeHost(rawHost)
  if (!host) return false

  if (base && (host === base || host.endsWith(`.${base}`))) {
    const label = host.slice(0, -(base.length + 1))
    return host !== base && !label.includes(".") && SUBDOMAIN_LABEL.test(label)
  }
  return isFullDomain(host)
}
