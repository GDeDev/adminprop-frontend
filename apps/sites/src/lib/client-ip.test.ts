import { describe, expect, it } from "vitest"

import { clientIp } from "./client-ip"

const headers = (values: Record<string, string>) => ({
  get: (name: string) => values[name.toLowerCase()] ?? null,
})

describe("clientIp", () => {
  it("no confía en el primer valor de X-Forwarded-For (lo escribe el cliente)", () => {
    expect(
      clientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }), {})
    ).toBe("203.0.113.9")
  })

  it("cuenta desde la derecha según los proxies de confianza", () => {
    const h = headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.2" })
    expect(clientIp(h, { SITES_TRUSTED_PROXY_HOPS: "2" })).toBe("203.0.113.9")
    expect(clientIp(h, { SITES_TRUSTED_PROXY_HOPS: "3" })).toBe("6.6.6.6")
  })

  it("usa el header que fija la plataforma, si está configurado", () => {
    const h = headers({
      "x-forwarded-for": "6.6.6.6",
      "cf-connecting-ip": "198.51.100.7",
    })
    expect(clientIp(h, { SITES_CLIENT_IP_HEADER: "CF-Connecting-IP" })).toBe(
      "198.51.100.7"
    )
    // Configurado y ausente: no cae al X-Forwarded-For.
    expect(
      clientIp(headers({ "x-forwarded-for": "6.6.6.6" }), {
        SITES_CLIENT_IP_HEADER: "x-real-ip",
      })
    ).toBeNull()
  })

  it("descarta lo que no es una IP", () => {
    expect(clientIp(headers({ "x-forwarded-for": "no-es-ip" }), {})).toBeNull()
    expect(
      clientIp(headers({ "x-forwarded-for": "1.2.3.4, <script>" }), {})
    ).toBeNull()
    expect(clientIp(headers({}), {})).toBeNull()
    expect(clientIp(headers({ "x-forwarded-for": "2001:db8::1" }), {})).toBe(
      "2001:db8::1"
    )
  })

  it("en producción sin header configurado no declara IP (XFF lo elige el cliente)", () => {
    const h = headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" })
    expect(clientIp(h, { NODE_ENV: "production" })).toBeNull()
    expect(
      clientIp(headers({ "x-real-ip": "203.0.113.9" }), {
        NODE_ENV: "production",
        CUSTOM: "x",
        SITES_CLIENT_IP_HEADER: "x-real-ip",
        CLIENT_IP_HEADER: "x-real-ip",
      })
    ).toBe("203.0.113.9")
  })
})
