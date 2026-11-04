/**
 * Contador animado: solo presentación.
 *
 * El frontend no calcula montos (la API manda strings). Estas funciones leen
 * el string ya formateado que llegó, lo interpolan visualmente de 0 al valor
 * y SIEMPRE terminan mostrando el string original, byte a byte. Nada de lo
 * que se anima se guarda, se suma ni se manda a ningún lado.
 */

export interface NumberTemplate {
  prefix: string
  suffix: string
  /** Valor numérico leído del string (solo para interpolar). */
  value: number
  decimals: number
  thousands: string
  decimal: string
}

const NUMBER_PART = /-?\d[\d.,]*/

/** Descompone "$ 1.250.000,50" en prefijo, número y sufijo. `null` si no hay número. */
export function parseTemplate(text: string): NumberTemplate | null {
  const match = NUMBER_PART.exec(text)
  if (!match) return null
  const raw = match[0].replace(/[.,]$/, "")
  const prefix = text.slice(0, match.index)
  const suffix = text.slice(match.index + raw.length)

  const lastDot = raw.lastIndexOf(".")
  const lastComma = raw.lastIndexOf(",")
  let decimal = ""
  let thousands = ""

  if (lastDot >= 0 && lastComma >= 0) {
    decimal = lastDot > lastComma ? "." : ","
    thousands = decimal === "." ? "," : "."
  } else {
    const sep = lastDot >= 0 ? "." : lastComma >= 0 ? "," : ""
    if (sep) {
      const groups = raw.split(sep)
      const last = groups[groups.length - 1]!
      // "1.250" es miles; "12,5" y "1.25" son decimales; varios separadores = miles.
      if (groups.length > 2 || last.length === 3) thousands = sep
      else decimal = sep
    }
  }

  const digitsOnly = raw.split(thousands || "\u0000").join("")
  const normalized = decimal ? digitsOnly.replace(decimal, ".") : digitsOnly
  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  const decimals = decimal ? raw.length - raw.lastIndexOf(decimal) - 1 : 0

  return { prefix, suffix, value, decimals, thousands, decimal }
}

/** Escribe `n` con el mismo formato (separadores y decimales) que la plantilla. */
export function formatLike(template: NumberTemplate, n: number): string {
  const fixed = Math.abs(n).toFixed(template.decimals)
  const [intPart, fracPart] = fixed.split(".")
  const grouped = template.thousands
    ? intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, template.thousands)
    : intPart!
  const number = fracPart ? `${grouped}${template.decimal}${fracPart}` : grouped
  return `${template.prefix}${n < 0 ? "-" : ""}${number}${template.suffix}`
}

/** Curva de entrada suave (ease-out cúbica). */
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/**
 * Texto a mostrar en el instante `progress` (0..1). En 1 devuelve `text`
 * exacto; si el texto no tiene número, también.
 */
export function countUpText(text: string, progress: number): string {
  if (progress >= 1) return text
  const template = parseTemplate(text)
  if (!template) return text
  return formatLike(template, template.value * easeOutCubic(progress))
}
