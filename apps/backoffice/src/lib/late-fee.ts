import { apiErrorCode } from "@adminprop/session/client"
import type { ContractCurrentBillingTerms } from "@adminprop/shared-types"

import { normalizeAmount } from "./contracts"

/**
 * El punitorio de un contrato se define con el porcentaje diario más UNA de
 * dos formas de decir "desde cuándo corre": los días de gracia o el día del
 * mes en que empieza (D-228). La API devuelve 400 si llegan las dos.
 */
export type LateFeeTiming = "GRACE" | "START_DAY"

export interface LateFeeValues {
  customLateFee: boolean
  lateFeePercentage: string
  lateFeeTiming: LateFeeTiming
  lateFeeGraceDays: string
  lateFeeStartDay: string
}

/** Lo que manda la API para el punitorio; solo uno de gracia / día de inicio. */
export interface LateFeeRequestFields {
  lateFeePercentage: string | null
  lateFeeGraceDays?: number | null
  lateFeeStartDay?: number
}

/**
 * Del formulario al cuerpo de la API. Sin punitorio propio se hereda el de la
 * inmobiliaria (`null`). Con uno propio, nunca viajan juntos los días de
 * gracia y el día de inicio.
 */
export function lateFeeRequestFields(
  values: LateFeeValues
): LateFeeRequestFields {
  if (!values.customLateFee) {
    return { lateFeePercentage: null, lateFeeGraceDays: null }
  }
  const percentage = normalizeAmount(values.lateFeePercentage)
  if (values.lateFeeTiming === "START_DAY") {
    return {
      lateFeePercentage: percentage,
      lateFeeStartDay: Number(values.lateFeeStartDay),
    }
  }
  return {
    lateFeePercentage: percentage,
    lateFeeGraceDays: Number(values.lateFeeGraceDays),
  }
}

/** Valores iniciales del formulario a partir de los términos vigentes. */
export function lateFeeDefaults(
  terms: Pick<
    ContractCurrentBillingTerms,
    "lateFeePercentage" | "lateFeeGraceDays"
  >,
  custom: boolean
): LateFeeValues {
  return {
    customLateFee: custom,
    lateFeePercentage: terms.lateFeePercentage ?? "",
    lateFeeTiming: "GRACE",
    lateFeeGraceDays:
      terms.lateFeeGraceDays === null ? "" : String(terms.lateFeeGraceDays),
    lateFeeStartDay: "",
  }
}

export interface LateFeeIssue {
  path: "lateFeePercentage" | "lateFeeGraceDays" | "lateFeeStartDay"
  message: string
}

/** Reglas del bloque de punitorio propio; devuelve los errores por campo. */
export function validateLateFee(values: LateFeeValues): LateFeeIssue[] {
  if (!values.customLateFee) return []
  const issues: LateFeeIssue[] = []
  const percentage = normalizeAmount(values.lateFeePercentage)
  if (percentage === null) {
    issues.push({
      path: "lateFeePercentage",
      message: "Ingresá el porcentaje diario.",
    })
  } else if (Number(percentage) > 100) {
    issues.push({
      path: "lateFeePercentage",
      message: "El punitorio diario no puede superar el 100 %.",
    })
  }
  if (values.lateFeeTiming === "START_DAY") {
    const day = values.lateFeeStartDay.trim()
    if (!/^\d{1,2}$/.test(day) || Number(day) < 1 || Number(day) > 31) {
      issues.push({
        path: "lateFeeStartDay",
        message: "Ingresá el día del mes en que empieza, de 1 a 31.",
      })
    }
  } else if (!/^\d{1,2}$/.test(values.lateFeeGraceDays.trim())) {
    issues.push({
      path: "lateFeeGraceDays",
      message: "Ingresá los días de gracia (0 a 31).",
    })
  }
  return issues
}

export const LATE_FEE_REQUIRED_MESSAGE =
  "La inmobiliaria no tiene un punitorio por defecto: indicá el porcentaje diario de este contrato."
export const LATE_FEE_BOTH_TIMINGS_MESSAGE =
  "Elegí días de gracia o día de inicio del punitorio, no los dos."

/**
 * Los 400 del punitorio al guardar un contrato (alta, renovación o cambio de
 * términos), traducidos a un campo y un texto claro. `null` si el error es
 * otro. El texto de la API nombra campos técnicos, por eso no se muestra.
 */
export function lateFeeApiError(
  cause: unknown
): { field: LateFeeIssue["path"]; message: string } | null {
  switch (apiErrorCode(cause)) {
    case "CONTRACT_LATE_FEE_PERCENTAGE_REQUIRED":
      return { field: "lateFeePercentage", message: LATE_FEE_REQUIRED_MESSAGE }
    default:
      return null
  }
}

/** "0.50" → "0,50 %": solo presentación del string que manda la API. */
export function percentLabel(value: string): string {
  return `${value.replace(".", ",")} %`
}
