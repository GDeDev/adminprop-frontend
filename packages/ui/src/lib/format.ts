/**
 * Formato compartido por el backoffice y el portal (A-34): sólo presentación,
 * sin aritmética. Los montos los calcula la API y llegan como string.
 */

/**
 * Importe de la API (string decimal) para mostrar: "$ 150.333,33".
 *
 * El espacio entre el símbolo y el número es un espacio de no separación
 * (U+00A0): así el importe nunca se parte en dos líneas después del símbolo.
 * Si `amount` no parece un número se devuelve tal cual.
 */
export function formatMoney(
  amount: string,
  currency: string,
  options: { maximumFractionDigits?: number } = {}
): string {
  const value = Number(amount)
  if (amount.trim() === "" || Number.isNaN(value)) return amount
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    ...(options.maximumFractionDigits !== undefined
      ? {
          minimumFractionDigits: 0,
          maximumFractionDigits: options.maximumFractionDigits,
        }
      : {}),
  })
    .format(value)
    .replace(/\s/g, "\u00a0")
}

/** `AAAA-MM` → "octubre de 2026" (minúscula, como va dentro de una frase). */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month) return period
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

/** `AAAA-MM` → "Octubre de 2026": sólo la primera letra en mayúscula (títulos). */
export function periodTitle(period: string): string {
  return capitalizeFirst(periodLabel(period))
}

/** Pone en mayúscula únicamente la primera letra ("cuota de mayo" → "Cuota de mayo"). */
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toLocaleUpperCase("es-AR") + text.slice(1)
}
