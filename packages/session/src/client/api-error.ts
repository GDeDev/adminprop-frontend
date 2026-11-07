import { isAxiosError } from "axios"

import type { ApiError } from "@adminprop/shared-types"

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisá tu conexión y probá de nuevo."

/**
 * Códigos cuyo mensaje del servidor es técnico (nombres de campos, constraints
 * de la base) o demasiado genérico para una persona. Se reemplazan siempre,
 * aunque la API mande texto. Los códigos de dominio ya llegan con un mensaje
 * en español pensado para el usuario y no van acá.
 */
const FRIENDLY_MESSAGES: Record<string, string> = {
  // Único de la base (D-240): por ejemplo, un segundo aumento del mismo
  // contrato y fecha, o un doble click que repite el alta.
  UNIQUE_CONSTRAINT_VIOLATION:
    "Ya existe un registro igual (por ejemplo, un aumento del mismo contrato con la misma fecha). Recargá la pantalla para ver el que ya está cargado.",
  // CHECK de la base: montos negativos, porcentajes fuera de 0 a 100, fechas
  // en desorden. La API responde 422 con este código estable y nunca expone
  // el nombre del constraint (DT-174).
  CHECK_CONSTRAINT_VIOLATION:
    "Algún dato no cumple las reglas del sistema (un monto, porcentaje o fecha fuera de rango). Revisalo y volvé a intentar.",
  // Error de base genérico (5xx): no es un dato inválido del usuario.
  DATABASE_ERROR:
    "No se pudo guardar por un problema del sistema. Probá de nuevo en unos minutos y, si sigue pasando, avisá a soporte.",
  IDEMPOTENCY_KEY_REUSED:
    "Ese pedido ya se envió con otros datos. Recargá la pantalla para ver si quedó registrado.",
  // Confirmar una liquidación que cambió (pago anulado o gasto editado, D-259 del backend):
  // la API la recalcula y responde 409; al recargar ya viene actualizada.
  SETTLEMENT_STALE:
    "La liquidación cambió (se anuló un pago o se editó un gasto) y se recalculó. Revisá los montos y confirmá de nuevo.",
  // Pago fechado antes de otro que ya cobró punitorio (D-261 del backend).
  PAYMENT_DATE_BEFORE_LATE_FEE_PAYMENT:
    "Hay un pago posterior que ya cobró punitorio. Anulalo, cargá este pago y después volvé a cargar el otro, en orden de fecha.",
  // Job global pedido hace poco (D-254): 409 con cooldown entre corridas.
  AUTOMATION_JOB_COOLDOWN: "Ya se pidió hace poco, probá en unos minutos.",
  // Job global desde una inmobiliaria (D-254): 403, corre solo en su horario.
  AUTOMATION_JOB_GLOBAL:
    "Esa tarea es de toda la plataforma y corre sola en su horario.",
  CONTRACT_MANUAL_RENT_ADJUSTMENT_ADMIN_ONLY:
    "Cargar el alquiler a mano lo hace un administrador.",
}

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
  const code = error.response.data?.code
  if (typeof code === "string" && code in FRIENDLY_MESSAGES) {
    return FRIENDLY_MESSAGES[code]!
  }
  const message = error.response.data?.message
  if (typeof message !== "string" || message.length === 0) return fallback
  // Nunca mostrar errores crudos del servidor ("Cannot GET /api/v1/...").
  if (isRawServerMessage(message)) return fallback
  // Un 5xx sin código estable es un fallo inesperado: texto de respaldo.
  if (error.response.status >= 500 && !error.response.data?.code)
    return fallback
  return message
}

/** Mensajes técnicos del framework que el usuario no debería ver. */
function isRawServerMessage(message: string): boolean {
  return (
    /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD)\b/.test(message) ||
    /\/api\/v\d/.test(message) ||
    /^(Internal server error|Bad Gateway|Service Unavailable|Not Found|Unauthorized|Forbidden|Bad Request|Too Many Requests|Payload Too Large|Unprocessable Entity|Conflict)$/i.test(
      message
    )
  )
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
