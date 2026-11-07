import { safeHttpUrl } from "./safe-url"

/**
 * Abre en una pestaña nueva una URL que hay que pedir primero (`resolve`).
 *
 * Safari/iOS y los bloqueadores bloquean un `window.open` que no ocurre dentro
 * del gesto del usuario, y después de un `await` ya no lo es. Por eso la
 * pestaña se abre en blanco ANTES de pedir la URL y después se le asigna.
 * Si no hay URL válida (o falla el pedido), la pestaña se cierra.
 *
 * Devuelve `true` si se abrió algo. Los errores de `resolve` se propagan
 * (después de cerrar la pestaña en blanco).
 */
export async function openInNewTab(
  resolve: () => Promise<string | null | undefined>
): Promise<boolean> {
  const tab = window.open("", "_blank")
  // Sin `noopener` en el feature string no se puede asignar la URL después;
  // se corta la relación a mano.
  if (tab) tab.opener = null
  try {
    const url = safeHttpUrl(await resolve())
    if (!url) {
      tab?.close()
      return false
    }
    if (tab) tab.location.href = url
    else window.open(url, "_blank", "noopener,noreferrer")
    return true
  } catch (error) {
    tab?.close()
    throw error
  }
}
