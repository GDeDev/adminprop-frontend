import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { absoluteBase, escapeXml } from "./absolute-url"
import type { SiteRoute } from "./site-route"

const req = (headers: Record<string, string>) =>
  new NextRequest("http://localhost:3003/sitemap.xml", { headers })

describe("absoluteBase", () => {
  it("en el sitio por host usa https y el host de la ruta, aunque el pedido llegue por http", () => {
    const route: SiteRoute = {
      mode: "host",
      slug: "a",
      previewToken: null,
      host: "a.com",
    }
    expect(absoluteBase(req({ host: "a.com" }), route)).toBe("https://a.com")
  })

  it("en desarrollo (acceso por slug) usa el pedido y el prefijo /_s/<slug>", () => {
    const route: SiteRoute = { mode: "dev", slug: "demo", previewToken: null }
    expect(
      absoluteBase(
        req({ host: "localhost:3003", "x-forwarded-proto": "http" }),
        route
      )
    ).toBe("http://localhost:3003/_s/demo")
  })
})

describe("escapeXml", () => {
  it("escapa los cinco caracteres de XML", () => {
    expect(escapeXml(`a&b<c>"d"'e'`)).toBe(
      "a&amp;b&lt;c&gt;&quot;d&quot;&apos;e&apos;"
    )
  })
})
