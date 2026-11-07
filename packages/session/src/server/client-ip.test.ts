import { describe, expect, it } from "vitest"

import { clientIp } from "./client-ip"

const headers = (values: Record<string, string>) => ({
  get: (name: string) => values[name.toLowerCase()] ?? null,
})

describe("clientIp (BFF)", () => {
  it("fuera de producción cuenta X-Forwarded-For desde la derecha", () => {
    expect(
      clientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }), {})
    ).toBe("203.0.113.9")
  })

  it("en producción sin CLIENT_IP_HEADER no declara IP", () => {
    expect(
      clientIp(headers({ "x-forwarded-for": "203.0.113.9" }), {
        NODE_ENV: "production",
      })
    ).toBeNull()
  })

  it("en producción con CLIENT_IP_HEADER usa ese header", () => {
    expect(
      clientIp(headers({ "x-real-ip": "203.0.113.9" }), {
        NODE_ENV: "production",
        CLIENT_IP_HEADER: "x-real-ip",
      })
    ).toBe("203.0.113.9")
  })
})
