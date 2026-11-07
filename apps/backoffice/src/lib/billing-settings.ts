import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"

import { normalizeAmount } from "./contracts"

/** Tope de días de gracia que acepta la API (D-228). */
export const MAX_PAYMENT_GRACE_DAYS = 60

/**
 * Punitorio diario escrito por la persona → string para la API ("0.50"), o el
 * motivo por el que no sirve. Solo valida el rango 0–100 con 2 decimales; no
 * calcula nada.
 */
export function parseLateFeePercentage(
  input: string
): { value: string } | { error: string } {
  const value = normalizeAmount(input)
  if (value === null) {
    return { error: "Ingresá un porcentaje, por ejemplo 0,50." }
  }
  if (Number(value) > 100) {
    return { error: "El punitorio diario no puede superar el 100 %." }
  }
  return { value }
}

/** Días de gracia → número entero de 0 a 60, o el motivo por el que no sirve. */
export function parseGraceDays(
  input: string
): { value: number } | { error: string } {
  const trimmed = input.trim()
  if (!/^\d{1,3}$/.test(trimmed)) {
    return { error: "Ingresá un número entero de días, de 0 a 60." }
  }
  const value = Number(trimmed)
  if (value > MAX_PAYMENT_GRACE_DAYS) {
    return {
      error: `Los días de gracia no pueden superar ${MAX_PAYMENT_GRACE_DAYS}.`,
    }
  }
  return { value }
}

/**
 * Texto del error al guardar los parámetros de cobro, siempre en español. El
 * mensaje de la API nombra el campo técnico (`dailyLateFeePercentage: ...`),
 * así que se traduce en vez de mostrarlo crudo.
 */
export function billingSettingsErrorMessage(cause: unknown): string {
  if (apiErrorCode(cause) === "TENANT_INVALID_BILLING_SETTING") {
    const raw = apiErrorMessage(cause, "")
    if (raw.startsWith("dailyLateFeePercentage")) {
      return "El punitorio diario tiene que estar entre 0 y 100 %, con hasta 2 decimales, y no se puede quitar una vez fijado."
    }
    if (raw.startsWith("paymentGraceDays")) {
      return "Los días de gracia tienen que ser un número entero de 0 a 60."
    }
    return "Revisá el punitorio diario (0 a 100 %) y los días de gracia (0 a 60)."
  }
  return apiErrorMessage(cause, "No se pudieron guardar los parámetros.")
}
