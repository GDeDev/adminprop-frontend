import { afterEach, describe, expect, it, vi } from "vitest"

import { requestHost } from "./request-host"

const headers = (h: Record<string, string>) => new Headers(h)

describe("requestHost", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("por defecto ignora X-Forwarded-Host y usa Host", () => {
    expect(
      requestHost(
        headers({ host: "a.sites.test", "x-forwarded-host": "b.com" })
      )
    ).toBe("a.sites.test")
  })

  it("con SITES_TRUST_FORWARDED_HOST=true usa el primer X-Forwarded-Host", () => {
    vi.stubEnv("SITES_TRUST_FORWARDED_HOST", "true")
    expect(
      requestHost(
        headers({ host: "interno:3000", "x-forwarded-host": "b.com, c.com" })
      )
    ).toBe("b.com")
  })

  it("con la variable pero sin el header, cae a Host", () => {
    vi.stubEnv("SITES_TRUST_FORWARDED_HOST", "true")
    expect(requestHost(headers({ host: "a.sites.test" }))).toBe("a.sites.test")
  })

  it("sin ningún header devuelve vacío", () => {
    expect(requestHost(headers({}))).toBe("")
  })
})
