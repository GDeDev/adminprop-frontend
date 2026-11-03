/**
 * Headers de seguridad HTTP compartidos por backoffice y portal (hallazgo A-2
 * de la auditoría). Se importa desde los `next.config.ts` de las dos apps.
 *
 * Decisión sobre la CSP: no usa nonce. Un nonce obliga a renderizar TODAS las
 * páginas en forma dinámica (en el portal rompería el ISR de las fichas
 * públicas) y Next + `next-themes` + el `style` inline del <html> (color de
 * marca) necesitan scripts/estilos inline. Por eso `script-src` y `style-src`
 * admiten 'unsafe-inline'. Lo que sí queda cerrado y es lo que importa para
 * este riesgo: `frame-ancestors 'none'` (clickjacking), `object-src 'none'`,
 * `base-uri 'self'`, `form-action 'self'` y `connect-src` limitado al origen
 * propio y al de la API (un XSS no puede exfiltrar el access token a un
 * dominio ajeno). Para endurecer a futuro: nonce/hash cuando se pase a
 * renderizado dinámico, empezando con `Content-Security-Policy-Report-Only`.
 */

export interface SecurityHeader {
  key: string
  value: string
}

export interface SecurityHeadersOptions {
  /** `NEXT_PUBLIC_API_URL` (con prefijo de versión); de ahí sale el origen. */
  apiUrl?: string
  /** Desarrollo: React/Next necesitan `eval` y websocket de HMR. */
  isDev?: boolean
}

/** Origen (`https://host:puerto`) de una URL, o `null` si no es http(s). */
export function originOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null
    return parsed.origin
  } catch {
    return null
  }
}

export function buildCsp({
  apiUrl,
  isDev = false,
}: SecurityHeadersOptions = {}): string {
  const apiOrigin = originOf(apiUrl)
  const connect = ["'self'", ...(apiOrigin ? [apiOrigin] : [])]
  if (isDev) connect.push("ws:", "wss:")

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    // Fotos y logos: Cloudinary y la API (storage local en desarrollo).
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
      ...(isDev ? ["http:"] : []),
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": connect,
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    // La vista previa de emails usa un iframe `srcdoc` con sandbox.
    "frame-src": ["'self'", "about:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  }

  const parts = Object.entries(directives).map(
    ([name, values]) => `${name} ${values.join(" ")}`
  )
  return parts.join("; ")
}

export function securityHeaders(
  options: SecurityHeadersOptions = {}
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: buildCsp(options) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ]
  // HSTS sólo en producción: en desarrollo (http://localhost) no corresponde.
  if (!options.isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    })
  }
  return headers
}
