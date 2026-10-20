/**
 * Fechas `AAAA-MM-DD` sin pasar por `Date` local: la API manda fechas sin
 * hora y convertirlas a `Date` en el navegador corre un día según la zona
 * horaria. Lo poco de aritmética que hace falta (días entre dos fechas) se
 * hace en UTC, donde no hay desfase.
 */

/** "2026-03-01" → "01/03/2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}

/** "2026-03" → "03/2026" (períodos de índices). */
export function formatPeriod(period: string | null | undefined): string {
  if (!period) return "—"
  const [year, month] = period.split("-")
  return `${month}/${year}`
}

export function isIsoDate(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/** La fecha de hoy del navegador, como `AAAA-MM-DD`. */
export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function toUtc(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number)
  return Date.UTC(year!, month! - 1, day!)
}

/** Días de `from` a `to` (negativo si `to` ya pasó). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000)
}

/** `iso` más `days` días, como `AAAA-MM-DD`. */
export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * 86_400_000).toISOString().slice(0, 10)
}
