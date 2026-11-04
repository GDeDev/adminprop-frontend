import { describe, expect, it } from "vitest"

import { buildSitemap, sitemapDate } from "./sitemap"

describe("sitemapDate", () => {
  it("normaliza a ISO y omite lo ilegible o vacío", () => {
    expect(sitemapDate("2026-11-03T12:00:00.000Z")).toBe(
      "2026-11-03T12:00:00.000Z"
    )
    expect(sitemapDate("2026-11-03")).toBe("2026-11-03T00:00:00.000Z")
    expect(sitemapDate("ayer")).toBeNull()
    expect(sitemapDate("")).toBeNull()
    expect(sitemapDate(null)).toBeNull()
    expect(sitemapDate(undefined)).toBeNull()
  })
})

describe("buildSitemap", () => {
  it("lleva lastmod solo donde hay una fecha real", () => {
    const xml = buildSitemap("https://a.com", [
      { path: "", lastmod: "2026-11-03T12:00:00.000Z" },
      { path: "/propiedades/abc" },
      { path: "/contacto", lastmod: "no-es-fecha" },
    ])
    expect(xml).toContain(
      "<url><loc>https://a.com</loc><lastmod>2026-11-03T12:00:00.000Z</lastmod></url>"
    )
    expect(xml).toContain("<url><loc>https://a.com/propiedades/abc</loc></url>")
    expect(xml).toContain("<url><loc>https://a.com/contacto</loc></url>")
    expect(xml.match(/<lastmod>/g)).toHaveLength(1)
  })

  it("escapa los caracteres de XML en las URL", () => {
    const xml = buildSitemap("https://a.com", [{ path: "/x?a=1&b=<2>" }])
    expect(xml).toContain("https://a.com/x?a=1&amp;b=&lt;2&gt;")
    expect(xml).not.toContain("<2>")
  })

  it("es un urlset válido aunque no haya entradas", () => {
    expect(buildSitemap("https://a.com", [])).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n</urlset>\n'
    )
  })
})
