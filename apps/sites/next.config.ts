import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV !== "production"

/**
 * Orígenes del backoffice que pueden embeber la vista previa en un iframe
 * (solo cuando el pedido trae `?preview=`). Sin valor: el de desarrollo.
 */
const previewAncestors = (
  process.env.SITES_PREVIEW_ANCESTORS ??
  (isDev ? "http://localhost:3001 http://127.0.0.1:3001" : "")
)
  .split(/[\s,]+/)
  .filter(Boolean)

/**
 * Orígenes extra de imágenes (separados por espacio o coma). Las fotos
 * normalmente son `https:`; en desarrollo el storage local las sirve desde
 * `http://localhost:3000`, y este valor las habilita.
 */
const extraImageSources = (
  process.env.SITES_IMAGE_SOURCES ?? (isDev ? "http://localhost:3000" : "")
)
  .split(/[\s,]+/)
  .filter(Boolean)
  .join(" ")

/**
 * CSP del sitio público. `script-src 'unsafe-inline'` es el costo de servir
 * HTML cacheable (ISR): Next inyecta scripts en línea para hidratar y un nonce
 * por pedido obligaría a renderizar todo en cada visita. A cambio, nada de lo
 * que escribe el usuario llega al DOM como HTML (ver CLAUDE.md), el sitio no
 * tiene cookies ni sesión, y el resto de las directivas queda cerrado.
 */
function csp(frameAncestors: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' https: data: blob:${extraImageSources ? ` ${extraImageSources}` : ""}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ")
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
]

const nextConfig: NextConfig = {
  transpilePackages: ["@adminprop/shared-types"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          { key: "Content-Security-Policy", value: csp("'none'") },
        ],
      },
      // La vista previa del backoffice se embebe en un iframe. Va después de
      // la regla general: para la misma clave gana la última.
      ...(previewAncestors.length > 0
        ? [
            {
              source: "/:path*",
              has: [{ type: "query" as const, key: "preview" }],
              headers: [
                {
                  key: "Content-Security-Policy",
                  value: csp(previewAncestors.join(" ")),
                },
              ],
            },
          ]
        : []),
    ]
  },
}

export default nextConfig
