import { describe, expect, it } from "vitest"

import {
  buildCsp,
  originOf,
  securityHeaders,
} from "../../../../config/security-headers"

describe("security headers", () => {
  it("saca el origen de la API y descarta esquemas raros", () => {
    expect(originOf("https://api.ejemplo.com/api/v1")).toBe(
      "https://api.ejemplo.com"
    )
    expect(originOf("javascript:alert(1)")).toBeNull()
    expect(originOf(undefined)).toBeNull()
    expect(originOf("no es una url")).toBeNull()
  })

  it("la CSP de producción cierra framing, plugins y exfiltración", () => {
    const csp = buildCsp({ apiUrl: "https://api.ejemplo.com/api/v1" })
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("connect-src 'self' https://api.ejemplo.com")
    expect(csp).not.toContain("unsafe-eval")
    expect(csp).not.toContain("ws:")
  })

  it("en desarrollo permite eval y websocket de HMR", () => {
    const csp = buildCsp({
      apiUrl: "http://localhost:3000/api/v1",
      isDev: true,
    })
    expect(csp).toContain("'unsafe-eval'")
    expect(csp).toContain("ws:")
  })

  it("incluye los headers básicos y HSTS sólo en producción", () => {
    const prod = Object.fromEntries(
      securityHeaders().map((h) => [h.key, h.value])
    )
    expect(prod["X-Frame-Options"]).toBe("DENY")
    expect(prod["X-Content-Type-Options"]).toBe("nosniff")
    expect(prod["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    expect(prod["Strict-Transport-Security"]).toContain("max-age=")
    expect(prod["Permissions-Policy"]).toContain("camera=()")
    const dev = securityHeaders({ isDev: true }).map((h) => h.key)
    expect(dev).not.toContain("Strict-Transport-Security")
  })
})
