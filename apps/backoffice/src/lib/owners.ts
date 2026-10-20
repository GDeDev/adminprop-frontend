import type { OwnerSummary } from "@adminprop/shared-types"

/** "20123456" → "20.123.456"; un CUIT de 11 dígitos → "20-12345678-9". */
export function formatNationalId(digits: string): string {
  if (digits.length === 11) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/** El CBU se lee mejor en sus dos bloques (banco + cuenta). */
export function formatCbu(cbu: string): string {
  return cbu.length === 22 ? `${cbu.slice(0, 8)} ${cbu.slice(8)}` : cbu
}

/** "3 propiedades, 2 alquiladas" para tarjetas y tablas. */
export function portfolioLabel(
  owner: Pick<OwnerSummary, "propertyCount" | "activePropertyCount">
): string {
  if (owner.propertyCount === 0) return "Sin propiedades"
  const total =
    owner.propertyCount === 1
      ? "1 propiedad"
      : `${owner.propertyCount} propiedades`
  return owner.activePropertyCount > 0
    ? `${total}, ${owner.activePropertyCount} alquilada${owner.activePropertyCount === 1 ? "" : "s"}`
    : total
}
