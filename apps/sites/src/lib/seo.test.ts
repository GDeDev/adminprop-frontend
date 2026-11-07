import { describe, expect, it } from "vitest"

import { makeSite } from "@/test-fixtures"

import { excerpt, isFilteredListing, pageSeo } from "./seo"
import type { SiteRoute } from "./site-route"

const HOST: SiteRoute = {
  mode: "host",
  slug: "demo",
  previewToken: null,
  host: "www.demo.com.ar",
}

describe("pageSeo", () => {
  it("arma canonical y og:url absolutos y un openGraph completo", () => {
    const seo = pageSeo(makeSite(), HOST, "/propiedades/abc", {
      title: "Calle 7 1234",
      description: "Depto luminoso",
      image: "https://cdn.test/foto.jpg",
    })
    expect(seo.alternates).toEqual({
      canonical: "https://www.demo.com.ar/propiedades/abc",
    })
    expect(seo.openGraph).toMatchObject({
      type: "website",
      siteName: "Demo Inmobiliaria",
      locale: "es_AR",
      url: "https://www.demo.com.ar/propiedades/abc",
      title: "Calle 7 1234",
      images: [{ url: "https://cdn.test/foto.jpg" }],
    })
  })

  it("la home es la raíz del host y usa la imagen del sitio si la página no trae una", () => {
    const site = makeSite()
    site.content.seo.ogImageUrl = "https://cdn.test/og.jpg"
    const seo = pageSeo(site, HOST, "/", { title: "Demo" })
    expect(seo.alternates).toEqual({ canonical: "https://www.demo.com.ar" })
    expect(seo.openGraph?.images).toEqual([{ url: "https://cdn.test/og.jpg" }])
  })

  it("sin host conocido (desarrollo, vista previa) no emite canonical ni og:url", () => {
    for (const route of [
      { mode: "dev", slug: "demo", previewToken: null } as SiteRoute,
      { ...HOST, previewToken: "t".repeat(30), host: null },
    ]) {
      const seo = pageSeo(makeSite(), route, "/", { title: "Demo" })
      expect(seo.alternates).toBeUndefined()
      expect(seo.openGraph?.url).toBeUndefined()
    }
  })
})

describe("excerpt", () => {
  it("corta en una palabra y agrega puntos suspensivos", () => {
    const text = "palabra ".repeat(40)
    const out = excerpt(text, 60) ?? ""
    expect(out.length).toBeLessThanOrEqual(60)
    expect(out.endsWith("…")).toBe(true)
    expect(out).not.toMatch(/palabr…$/)
  })

  it("respeta lo corto, colapsa espacios y devuelve undefined si no hay texto", () => {
    expect(excerpt("  hola\n\n  mundo ")).toBe("hola mundo")
    expect(excerpt(null)).toBeUndefined()
    expect(excerpt("   ")).toBeUndefined()
  })
})

describe("isFilteredListing", () => {
  it("un listado sin filtros ni página no es filtrado", () => {
    expect(isFilteredListing({})).toBe(false)
    expect(isFilteredListing({ operation: undefined, page: undefined })).toBe(
      false
    )
  })

  it("cualquier filtro o página lo marca", () => {
    expect(isFilteredListing({ operation: "SALE" })).toBe(true)
    expect(isFilteredListing({ page: 2 })).toBe(true)
  })
})
