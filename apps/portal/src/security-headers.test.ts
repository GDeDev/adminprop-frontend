import { describe, expect, it } from "vitest"

import nextConfig from "../next.config"

describe("cabeceras de seguridad del portal", () => {
  it("las aplica a todas las rutas", async () => {
    const rules = (await nextConfig.headers?.()) ?? []
    expect(rules).toHaveLength(1)
    expect(rules[0]?.source).toBe("/:path*")
    const headers = Object.fromEntries(
      (rules[0]?.headers ?? []).map((h) => [h.key, h.value])
    )
    expect(headers["X-Content-Type-Options"]).toBe("nosniff")
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin")
    expect(headers["Permissions-Policy"]).toContain("camera=()")
    expect(headers["Strict-Transport-Security"]).toContain("max-age=")
    expect(headers["X-Frame-Options"]).toBe("DENY")
    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'none'")
  })

  it("no anuncia el framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false)
  })
})
