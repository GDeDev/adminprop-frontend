import type {
  GuaranteeType,
  RenterPaymentStatus,
} from "@adminprop/shared-types"

export const GUARANTEE_TYPE_LABELS: Record<GuaranteeType, string> = {
  PROPERTY: "Propiedad en garantía",
  PAYSLIPS: "Recibos de sueldo",
}

/** Qué se espera en el detalle según el tipo (spec Fase 8, 4). */
export const GUARANTEE_DETAIL_HINTS: Record<GuaranteeType, string> = {
  PROPERTY: "Dirección del inmueble y datos registrales.",
  PAYSLIPS: "Empleador y sueldo aproximado.",
}

/** Texto y variante de `Badge` del estado de pago; `null` hasta la Fase 11. */
export const PAYMENT_STATUS_META: Record<
  RenterPaymentStatus,
  { label: string; badge: "disponible" | "mora" }
> = {
  UP_TO_DATE: { label: "Al día", badge: "disponible" },
  OVERDUE: { label: "En mora", badge: "mora" },
}

/**
 * Link de WhatsApp (spec 5.2): sólo dígitos, con código de país. Un número
 * argentino sin código ("11 5555-1234", "011...", "15...") se lleva a +54 9.
 * Devuelve null si no parece un teléfono.
 */
export function whatsappLink(phone: string | null | undefined): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (!digits.startsWith("54")) {
    if (digits.startsWith("0")) digits = digits.slice(1)
    // Celular escrito como "15 xxxx xxxx" (sin característica): no se puede
    // completar sin saber la ciudad; se manda como está y WhatsApp decide.
    digits = `549${digits}`
  } else if (!digits.startsWith("549")) {
    digits = `549${digits.slice(2)}`
  }
  return digits.length >= 12 && digits.length <= 15
    ? `https://wa.me/${digits}`
    : null
}

/** "2026-03-01" → "01/03/2026", sin pasar por Date (evita el desfase UTC). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}
