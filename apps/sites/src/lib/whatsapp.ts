/** `https://wa.me/<dígitos>?text=…` o null si el número no sirve. */
export function whatsappLink(
  number: string | null,
  message?: string | null
): string | null {
  if (!number || !/^\d{8,15}$/.test(number)) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ""
  return `https://wa.me/${number}${text}`
}

/** `tel:` solo con dígitos y `+`. */
export function telLink(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, "")
  return digits.length >= 6 ? `tel:${digits}` : null
}
