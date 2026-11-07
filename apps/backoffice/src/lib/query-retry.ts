/**
 * Reintento por defecto de las queries: un solo reintento, y solo ante fallas
 * que pueden ser pasajeras (red, 5xx). Un 4xx (404 de un id inexistente, 403,
 * 422) no cambia por repetirlo y, con varias queries en paralelo en la misma
 * pantalla, duplicaba los pedidos.
 */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown
): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response
    ?.status
  if (typeof status === "number" && status >= 400 && status < 500) return false
  return failureCount < 1
}
