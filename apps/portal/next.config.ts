import type { NextConfig } from "next"

/**
 * Cabeceras de seguridad del portal. Sin CSP completa a propósito (no hay un
 * inventario de orígenes cerrado todavía); sí lo que no depende de él.
 * `frame-ancestors` + `X-Frame-Options` evitan que otro sitio embeba el portal
 * en un iframe (clickjacking); este no se embebe en ningún lado.
 */
export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
]

const nextConfig: NextConfig = {
  transpilePackages: [
    "@adminprop/ui",
    "@adminprop/shared-types",
    "@adminprop/mocks",
    "@adminprop/session",
  ],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
