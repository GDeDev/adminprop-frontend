import type {
  GuaranteeType,
  RenterPaymentStatus,
} from "@adminprop/shared-types"

import { buildWhatsAppLink } from "./whatsapp"

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

/** Link de WhatsApp sin mensaje (spec Fase 8, 5.2); ver `buildWhatsAppLink`. */
export function whatsappLink(phone: string | null | undefined): string | null {
  return buildWhatsAppLink(phone)
}
