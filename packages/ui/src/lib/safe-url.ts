/**
 * URL absoluta `http(s)` o `null`. Para todo lo que viene de la API o de
 * terceros (comprobantes, links de publicaciones, URL de autorización de
 * MercadoLibre) antes de usarlo como `href`, `src` o destino de navegación:
 * React 19 bloquea `javascript:` en `href`, pero no en
 * `location.assign` / `location.href`, y `data:` o `blob:` ajenos no tienen
 * por qué aparecer ahí.
 */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    return url.href
  } catch {
    return null
  }
}

/** Igual que `safeHttpUrl`, pero exige `https:` y, opcional, un host exacto. */
export function safeHttpsUrl(
  value: unknown,
  allowedHosts?: readonly string[]
): string | null {
  const href = safeHttpUrl(value)
  if (!href) return null
  const url = new URL(href)
  if (url.protocol !== "https:") return null
  if (allowedHosts && !allowedHosts.includes(url.hostname)) return null
  return href
}

/**
 * Ruta interna de la app (`/cobros/1?x=2`) o `null`. Rechaza URLs absolutas,
 * `//host`, barras invertidas y caracteres de control.
 */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null
  if (!value.startsWith("/") || value.startsWith("//")) return null
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f\s]/.test(value)) return null
  return value
}
