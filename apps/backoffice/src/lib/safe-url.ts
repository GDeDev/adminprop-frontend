/**
 * La URL, solo si es http(s). Las que vienen de la API (autorización de un
 * canal, link de WhatsApp) se asignan a `location`: un `javascript:` ahí
 * ejecutaría código en el origen del backoffice.
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? value : null
  } catch {
    return null
  }
}
