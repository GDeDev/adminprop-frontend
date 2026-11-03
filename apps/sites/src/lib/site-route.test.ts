import { describe, expect, it } from "vitest"

import {
  basePath,
  decodeSiteRoute,
  encodeSiteRoute,
  hrefFor,
  type SiteRoute,
} from "./site-route"

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0eXAiOiJzaXRlIn0.firma-del-token_123"

describe("site route", () => {
  it("codifica y decodifica los cuatro modos", () => {
    const routes: SiteRoute[] = [
      { mode: "host", slug: "mi-inmo", previewToken: null },
      { mode: "dev", slug: "mi-inmo", previewToken: null },
      { mode: "host", slug: "mi-inmo", previewToken: TOKEN },
      { mode: "dev", slug: "mi-inmo", previewToken: TOKEN },
    ]
    for (const route of routes) {
      expect(decodeSiteRoute(encodeSiteRoute(route))).toEqual(route)
    }
    expect(
      encodeSiteRoute({ mode: "host", slug: "mi-inmo", previewToken: null })
    ).toBe("h~mi-inmo")
  })

  it.each([
    "",
    "x~mi-inmo",
    "h~",
    "h~Mi Inmo",
    "h~../etc",
    "h~mi-inmo~token",
    "hp~mi-inmo",
    "hp~mi-inmo~corto",
    "h~mi-inmo~extra~mas",
    "nf~~",
  ])("rechaza %j", (segment) => {
    expect(decodeSiteRoute(segment)).toBeNull()
  })

  it("los links llevan el prefijo del modo y conservan la vista previa", () => {
    const host: SiteRoute = { mode: "host", slug: "a", previewToken: null }
    const dev: SiteRoute = { mode: "dev", slug: "a", previewToken: null }
    const preview: SiteRoute = { mode: "dev", slug: "a", previewToken: TOKEN }

    expect(basePath(host)).toBe("")
    expect(hrefFor(host)).toBe("/")
    expect(hrefFor(host, "/propiedades?x=1")).toBe("/propiedades?x=1")
    expect(hrefFor(dev)).toBe("/_s/a")
    expect(hrefFor(dev, "/propiedades/9")).toBe("/_s/a/propiedades/9")
    expect(hrefFor(preview, "/")).toBe(`/_s/a?preview=${TOKEN}`)
    expect(hrefFor(preview, "/propiedades?op=SALE")).toBe(
      `/_s/a/propiedades?op=SALE&preview=${TOKEN}`
    )
  })
})
