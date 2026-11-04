/**
 * Links que salen de lo que escribe la inmobiliaria. La API ya los valida, pero
 * el render no confía en eso: un esquema que no sea el esperado (`javascript:`,
 * `data:`, `vbscript:`, `http:`…) no se convierte en un `href`.
 */

/** URL de una red social: solo `https:`, sin credenciales, con host. Si no, `null`. */
export function socialHref(url: unknown): string | null {
  if (typeof url !== "string") return null
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== "https:") return null
    if (parsed.username || parsed.password || !parsed.hostname) return null
    return parsed.toString()
  } catch {
    return null
  }
}

const EMAIL = /^[^\s@<>()"'\\,;:]+@[^\s@<>()"'\\,;:]+\.[^\s@<>()"'\\,;:]{2,}$/

/**
 * `mailto:` solo para un email con forma de email (sin espacios, comillas ni
 * separadores que permitan agregar destinatarios o cabeceras: `a@b.com?bcc=…`
 * no pasa porque `?` no entra en el dominio válido de abajo).
 */
export function mailtoHref(email: unknown): string | null {
  if (typeof email !== "string") return null
  const value = email.trim()
  if (value.length > 254 || !EMAIL.test(value) || /[?&=#%]/.test(value)) {
    return null
  }
  return `mailto:${value}`
}
