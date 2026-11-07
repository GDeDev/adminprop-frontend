/**
 * Las URLs de archivos privados (comprobantes, contrato, póliza, rescisión)
 * son firmadas y vencen a los 10 minutos. Se abren apenas llegan y, si ya
 * pasó casi todo ese tiempo, se vuelve a pedir el recurso antes de abrir.
 */
export const FILE_URL_TTL_MS = 10 * 60 * 1000

/** Margen para que la pestaña alcance a cargar antes del vencimiento. */
export const FILE_URL_SAFETY_MS = 60 * 1000

/** `receivedAt` es el momento (ms) en que llegó la URL, p. ej. `query.dataUpdatedAt`. */
export function isFileUrlFresh(receivedAt: number, now = Date.now()): boolean {
  if (!receivedAt) return false
  return now - receivedAt < FILE_URL_TTL_MS - FILE_URL_SAFETY_MS
}
