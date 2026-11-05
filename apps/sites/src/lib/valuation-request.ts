/**
 * «Tasá tu propiedad»: captación de leads sobre el endpoint de contacto que ya
 * existe. No hay un backend de tasación; la solicitud llega como una consulta
 * común cuyo mensaje es un texto plano ordenado, para que quien la recibe en el
 * CRM vea de un vistazo qué se quiere tasar.
 */

export const VALUATION_PROPERTY_TYPES = [
  "Casa",
  "Departamento",
  "PH",
  "Terreno",
  "Local comercial",
  "Oficina",
  "Cochera",
  "Otro",
] as const

export const VALUATION_OPERATIONS = [
  { value: "SALE", label: "Vender" },
  { value: "RENT", label: "Alquilar" },
  { value: "BOTH", label: "Todavía no lo sé" },
] as const

export interface ValuationInput {
  propertyType: string
  operation: string
  address: string
  areaM2: string
  bedrooms: string
  notes: string
}

/** Largo máximo del mensaje que acepta el contacto (el servidor recorta a 2000). */
const MESSAGE_MAX = 2000

/** Encabezado fijo: sirve para filtrar estas consultas en la bandeja. */
export const VALUATION_HEADER = "Solicitud de tasación"

const clean = (value: string, max: number) =>
  value.replace(/\s+/g, " ").trim().slice(0, max)

const AREA = /^\d{1,6}([.,]\d{1,2})?$/

/** Errores por campo (vacío si está todo bien). Los opcionales solo se validan si vienen. */
export function validateValuation(
  input: ValuationInput
): Partial<Record<keyof ValuationInput, string>> {
  const errors: Partial<Record<keyof ValuationInput, string>> = {}
  if (!VALUATION_PROPERTY_TYPES.includes(input.propertyType as never)) {
    errors.propertyType = "Elegí el tipo de propiedad."
  }
  if (!VALUATION_OPERATIONS.some((o) => o.value === input.operation)) {
    errors.operation = "Contanos qué querés hacer con la propiedad."
  }
  if (clean(input.address, 200).length < 5) {
    errors.address = "Escribí la dirección y la zona de la propiedad."
  }
  if (input.areaM2.trim() && !AREA.test(input.areaM2.trim())) {
    errors.areaM2 = "Escribí la superficie solo con números, por ejemplo 85."
  }
  if (input.bedrooms.trim()) {
    const n = Number(input.bedrooms)
    if (!Number.isInteger(n) || n < 0 || n > 20) {
      errors.bedrooms = "Escribí un número de dormitorios entre 0 y 20."
    }
  }
  return errors
}

/** El mensaje de la consulta: texto plano, una línea por dato cargado. */
export function buildValuationMessage(input: ValuationInput): string {
  const operation =
    VALUATION_OPERATIONS.find((o) => o.value === input.operation)?.label ?? ""
  const lines = [
    VALUATION_HEADER,
    `Tipo de propiedad: ${clean(input.propertyType, 40)}`,
    `Quiere: ${operation}`,
    `Dirección y zona: ${clean(input.address, 200)}`,
  ]
  if (input.areaM2.trim()) lines.push(`Superficie: ${input.areaM2.trim()} m²`)
  if (input.bedrooms.trim()) lines.push(`Dormitorios: ${input.bedrooms.trim()}`)
  const notes = input.notes.trim()
  if (notes) lines.push(`Comentarios: ${notes}`)
  return lines.join("\n").slice(0, MESSAGE_MAX)
}
