/** `https://wa.me/<dígitos>?text=…` o null si el número no sirve. */
export function whatsappLink(
  number: string | null,
  message?: string | null
): string | null {
  if (!number || !/^\d{8,15}$/.test(number)) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${number}${text}`
}

/** Largo máximo del texto que se manda a `wa.me` (la URL entera tiene que viajar por un link). */
const SHARE_TEXT_MAX = 1500

/**
 * Link para compartir un texto por WhatsApp. Sin número abre el selector de
 * contactos (`https://wa.me/?text=…`); con número, un chat con ese contacto. El
 * número se sanea a dígitos (acepta `+54 9 221 555-0000`); si no queda un número
 * de 8 a 15 dígitos se ignora y se usa el selector. Siempre `https`.
 */
export function whatsappShareLink(
  text: string,
  number?: string | null
): string {
  const digits = (number ?? "").replace(/\D/g, "")
  const target = /^\d{8,15}$/.test(digits) ? digits : ""
  // Cortar en medio de un par sustituto (emoji) deja un carácter suelto que
  // hace fallar a encodeURIComponent: se recorta por puntos de código.
  const cut = Array.from(text).slice(0, SHARE_TEXT_MAX).join("")
  return `https://wa.me/${target}?text=${encodeURIComponent(cut)}`
}

/** `tel:` solo con dígitos y `+`. */
export function telLink(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, "")
  return digits.length >= 6 ? `tel:${digits}` : null
}
