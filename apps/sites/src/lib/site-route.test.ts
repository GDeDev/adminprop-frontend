import { describe, expect, it } from "vitest"

import {
  basePath,
  canonicalUrl,
  decodeSiteRoute,
  encodeSiteRoute,
  hrefFor,
  type SiteRoute,
} from "./site-route"

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0eXAiOiJzaXRlIn0.firma-del-token_123"

describe("site route", () => {
  it("codifica y decodifica los cuatro modos", () => {
    const routes: SiteRoute[] = [
      { mode: "host", slug: "mi-inmo", previewToken: null, host: null },
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

  it("el sitio por host puede llevar su host (sin puerto) para el canonical", () => {
    const route: SiteRoute = {
      mode: "host",
      slug: "mi-inmo",
      previewToken: null,
      host: "www.mi-inmo.com.ar",
    }
    expect(encodeSiteRoute(route)).toBe("h~mi-inmo~www.mi-inmo.com.ar")
    expect(decodeSiteRoute("h~mi-inmo~www.mi-inmo.com.ar")).toEqual(route)
    // Sin host sigue valiendo (compatibilidad).
    expect(decodeSiteRoute("h~mi-inmo")).toEqual({
      mode: "host",
      slug: "mi-inmo",
      previewToken: null,
      host: null,
    })
    // Un host imposible no es un segmento válido.
    for (const bad of [
      "h~mi-inmo~192.168.0.1",
      "h~mi-inmo~sin-punto",
      "h~mi-inmo~a_b.com",
      "d~mi-inmo~a.com",
    ]) {
      expect(decodeSiteRoute(bad)).toBeNull()
    }
  })

  it("el canonical es absoluto solo en el sitio público por host", () => {
    const host: SiteRoute = {
      mode: "host",
      slug: "a",
      previewToken: null,
      host: "a.com",
    }
    expect(canonicalUrl(host)).toBe("https://a.com")
    expect(canonicalUrl(host, "/propiedades/9")).toBe(
      "https://a.com/propiedades/9"
    )
    expect(canonicalUrl({ ...host, host: null })).toBeNull()
    expect(
      canonicalUrl({ mode: "dev", slug: "a", previewToken: null })
    ).toBeNull()
    expect(canonicalUrl({ ...host, previewToken: TOKEN })).toBeNull()
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
