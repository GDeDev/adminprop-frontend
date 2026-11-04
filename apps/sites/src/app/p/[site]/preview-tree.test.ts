import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/load-site", () => ({
  loadSite: vi.fn(async () => ({
    route: { mode: "dev", slug: "demo", previewToken: "t".repeat(30) },
    site: {
      template: "CLASSIC",
      theme: { background: "#181C14" },
      content: { brand: { displayName: "Demo" }, seo: {}, contact: {} },
    },
  })),
}))

import * as published from "../../s/[site]/layout"
import * as preview from "./layout"

/**
 * La vista previa (`/p`) reexporta las páginas del sitio publicado (`/s`) para
 * verse igual. Si una página nueva exporta algo que el árbol de vista previa no
 * reexporta, la vista previa deja de parecerse a lo que se publica.
 */
describe("árbol de vista previa", () => {
  it("el layout reexporta default, metadata y viewport del sitio publicado", () => {
    expect(preview.default).toBe(published.default)
    expect(preview.generateMetadata).toBe(published.generateMetadata)
    expect(preview.generateViewport).toBe(published.generateViewport)
  })

  it("la vista previa conserva el theme-color del sitio y es dinámica", async () => {
    const viewport = await preview.generateViewport({
      params: Promise.resolve({ site: "dp~demo~token" }),
    })
    expect(viewport.themeColor).toBe("#181C14")
    expect(preview.dynamic).toBe("force-dynamic")
  })
})
