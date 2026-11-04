/**
 * ¿El pedido viene del propio sitio? Compara el host del header `Origin` con el
 * `Host` del pedido. Un `Origin` ausente (curl, servidores) se acepta: este
 * chequeo solo frena el envío desde OTRAS páginas, que es lo que un navegador
 * siempre declara. Uno ilegible (`null`, que mandan los documentos
 * sandboxeados, o basura) NO se acepta: antes hacía lanzar a `new URL` y daba
 * un 500.
 */
export function isSameOrigin(
  origin: string | null,
  host: string | null
): boolean {
  if (origin === null) return true
  if (!host) return true
  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }
  return originHost === host.split(",")[0]?.trim()
}
