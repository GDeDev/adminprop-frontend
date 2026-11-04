import { AxiosError } from "axios"
import { describe, expect, it } from "vitest"

import {
  blocksWithErrors,
  buildDraftPatch,
  contrastRatio,
  isDraftDirty,
  mapFieldErrors,
  moveItem,
  normalizeDomainInput,
  previewRefreshDelay,
  previewUrl,
  removeItem,
  resolveFieldPath,
  siteErrorList,
  siteStatus,
  themeContrastChecks,
} from "./site"
import { makeDraft } from "../../test/site-fixtures"

describe("contrastRatio", () => {
  it("negro sobre blanco es 21 y es simétrico", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5)
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5)
  })

  it("mismo color es 1", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5)
  })

  it("coincide con valores conocidos de WCAG", () => {
    // #767676 sobre blanco es el gris más claro que pasa AA (4,54).
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2)
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5)
  })

  it("devuelve null con un hex inválido", () => {
    expect(contrastRatio("#FFF", "#000000")).toBeNull()
    expect(contrastRatio("rojo", "#000000")).toBeNull()
  })
})

describe("themeContrastChecks", () => {
  it("pasa con un tema legible", () => {
    const checks = themeContrastChecks(makeDraft().theme)
    expect(checks.map((c) => c.id)).toEqual([
      "text-background",
      "text-surface",
      "primary-background",
    ])
    expect(checks.every((c) => c.passes)).toBe(true)
  })

  it("exige 4,5 al texto y 3 al color principal", () => {
    const theme = {
      ...makeDraft().theme,
      text: "#9CA3AF",
      primary: "#E5E7EB",
    }
    const checks = themeContrastChecks(theme)
    expect(checks[0]!.passes).toBe(false)
    expect(checks[0]!.minimum).toBe(4.5)
    expect(checks[2]!.passes).toBe(false)
    expect(checks[2]!.minimum).toBe(3)
  })

  it("un hex inválido no pasa", () => {
    const checks = themeContrastChecks({ ...makeDraft().theme, text: "#12" })
    expect(checks[0]!.ratio).toBeNull()
    expect(checks[0]!.passes).toBe(false)
  })
})

describe("siteStatus", () => {
  it("publicado, borrador con cambios y sin publicar", () => {
    expect(
      siteStatus({
        enabled: true,
        publishedAt: "2026-01-01",
        hasUnpublishedChanges: false,
      })
    ).toBe("PUBLISHED")
    expect(
      siteStatus({
        enabled: true,
        publishedAt: "2026-01-01",
        hasUnpublishedChanges: true,
      })
    ).toBe("DRAFT_CHANGES")
    expect(
      siteStatus({
        enabled: false,
        publishedAt: null,
        hasUnpublishedChanges: true,
      })
    ).toBe("UNPUBLISHED")
  })

  it("despublicado (con fecha pero deshabilitado) es sin publicar", () => {
    expect(
      siteStatus({
        enabled: false,
        publishedAt: "2026-01-01",
        hasUnpublishedChanges: false,
      })
    ).toBe("UNPUBLISHED")
  })
})

describe("moveItem / removeItem", () => {
  it("mueve hacia arriba y hacia abajo sin mutar", () => {
    const list = ["a", "b", "c"]
    expect(moveItem(list, 2, 1)).toEqual(["a", "c", "b"])
    expect(moveItem(list, 0, 1)).toEqual(["b", "a", "c"])
    expect(list).toEqual(["a", "b", "c"])
  })

  it("fuera de rango no cambia nada", () => {
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"])
    expect(moveItem(["a", "b"], 1, 2)).toEqual(["a", "b"])
  })

  it("quita por posición", () => {
    expect(removeItem(["a", "b", "c"], 1)).toEqual(["a", "c"])
  })
})

describe("buildDraftPatch", () => {
  it("sin cambios es null", () => {
    expect(buildDraftPatch(makeDraft(), makeDraft())).toBeNull()
    expect(isDraftDirty(makeDraft(), makeDraft())).toBe(false)
  })

  it("manda solo el tema cambiado, campo a campo", () => {
    const local = makeDraft()
    local.theme.primary = "#000000"
    expect(buildDraftPatch(makeDraft(), local)).toEqual({
      theme: { primary: "#000000" },
    })
  })

  it("manda el bloque de content tocado entero, y solo ese", () => {
    const local = makeDraft()
    local.content.faqs = [
      ...local.content.faqs,
      { question: "¿Y los gastos?", answer: "Se informan." },
    ]
    const patch = buildDraftPatch(makeDraft(), local)
    expect(Object.keys(patch!)).toEqual(["content"])
    expect(Object.keys(patch!.content!)).toEqual(["faqs"])
    expect(patch!.content!.faqs).toHaveLength(3)
  })

  it("incluye el template si cambió, junto con el resto", () => {
    const local = makeDraft()
    local.template = "MODERN"
    local.content.hero.title = "Nuevo"
    local.theme.radius = 24
    expect(buildDraftPatch(makeDraft(), local)).toEqual({
      template: "MODERN",
      theme: { radius: 24 },
      content: { hero: local.content.hero },
    })
  })

  it("reordenar las secciones manda el bloque sections", () => {
    const local = makeDraft()
    local.content.sections = [...local.content.sections].reverse()
    expect(buildDraftPatch(makeDraft(), local)).toEqual({
      content: { sections: local.content.sections },
    })
  })

  it("volver al valor original deja de ser un cambio", () => {
    const local = makeDraft()
    local.theme.primary = "#000000"
    local.theme.primary = makeDraft().theme.primary
    expect(isDraftDirty(makeDraft(), local)).toBe(false)
  })
})

describe("errores por campo", () => {
  it("ubica los campos conocidos en su propio path", () => {
    expect(resolveFieldPath("content.faqs[2].answer")).toBe(
      "content.faqs[2].answer"
    )
    expect(resolveFieldPath("theme.primary")).toBe("theme.primary")
    expect(resolveFieldPath("content.contact.socials[0].url")).toBe(
      "content.contact.socials[0].url"
    )
    expect(resolveFieldPath("content.featured.propertyIds[1]")).toBe(
      "content.featured.propertyIds"
    )
  })

  it("los errores de lista o de elemento caen en el bloque", () => {
    expect(resolveFieldPath("content.faqs")).toBe("content.faqs")
    expect(resolveFieldPath("content.faqs[3]")).toBe("content.faqs")
    expect(resolveFieldPath("content.sections[1].key")).toBe("content.sections")
  })

  it("lo que no se reconoce queda sin ubicar", () => {
    expect(resolveFieldPath("content.otraCosa.x")).toBeNull()
    expect(resolveFieldPath("subdomain")).toBeNull()
    expect(resolveFieldPath("")).toBeNull()
  })

  it("mapFieldErrors separa ubicados y sin ubicar, y conserva el primero", () => {
    const { byPath, unmapped } = mapFieldErrors([
      { field: "content.faqs[2].answer", message: "Muy larga" },
      { field: "content.faqs[2].answer", message: "Otra" },
      { field: "algo.raro", message: "No sé" },
    ])
    expect(byPath).toEqual({ "content.faqs[2].answer": "Muy larga" })
    expect(unmapped).toEqual([{ field: "algo.raro", message: "No sé" }])
  })

  it("blocksWithErrors indica qué acordeones abrir", () => {
    expect(
      blocksWithErrors({
        "content.faqs[2].answer": "x",
        "content.seo.title": "y",
        "theme.primary": "z",
      }).sort()
    ).toEqual(["faqs", "seo"])
  })

  it("siteErrorList lee errors[] de un error de axios y descarta los sin campo", () => {
    const error = new AxiosError("x", "ERR", undefined, undefined, {
      status: 422,
      statusText: "",
      headers: {},
      config: {} as never,
      data: {
        errors: [
          { field: "content.seo.title", message: "Falta" },
          { message: "General" },
        ],
      },
    })
    expect(siteErrorList(error)).toEqual([
      { field: "content.seo.title", message: "Falta" },
    ])
    expect(siteErrorList(new Error("x"))).toEqual([])
  })
})

describe("URLs", () => {
  it("arma la URL del iframe con slug y token", () => {
    expect(previewUrl("oppido", "a.b.c", "http://localhost:3003")).toBe(
      "http://localhost:3003/_s/oppido?preview=a.b.c"
    )
  })

  it("renueva el token un minuto antes de que venza", () => {
    const now = Date.parse("2026-01-01T10:00:00Z")
    expect(previewRefreshDelay("2026-01-01T10:15:00Z", now)).toBe(14 * 60_000)
    expect(previewRefreshDelay("2026-01-01T10:00:30Z", now)).toBe(10_000)
  })

  it("normaliza el dominio propio", () => {
    expect(normalizeDomainInput(" HTTPS://Www.Oppido.com.ar/inicio ")).toBe(
      "www.oppido.com.ar"
    )
  })
})
