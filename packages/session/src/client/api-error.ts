import { isAxiosError } from "axios"

import type { ApiError } from "@adminprop/shared-types"

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo."

/**
 * Mensaje para mostrarle al usuario a partir de un error de la API.
 *
 * La API ya manda los mensajes en español y pensados para el usuario
 * (`message`), así que se usan tal cual. Para ramificar la lógica, usar
 * `apiErrorCode`, nunca el texto.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiError>(error)) return fallback
  if (!error.response) return NETWORK_MESSAGE
  const message = error.response.data?.message
  return typeof message === "string" && message.length > 0 ? message : fallback
}

/** El `code` estable del error de la API (`INVALID_CREDENTIALS`, ...). */
export function apiErrorCode(error: unknown): string | null {
  if (!isAxiosError<ApiError>(error)) return null
  const code = error.response?.data?.code
  return typeof code === "string" ? code : null
}

/** Errores por campo de un 400 de validación: `{ email: "..." }`. */
export function apiFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError<ApiError>(error)) return {}
  const details = error.response?.data?.errors ?? []
  const fields: Record<string, string> = {}
  for (const detail of details) {
    if (detail.field && !fields[detail.field]) {
      fields[detail.field] = detail.message
    }
  }
  return fields
}
