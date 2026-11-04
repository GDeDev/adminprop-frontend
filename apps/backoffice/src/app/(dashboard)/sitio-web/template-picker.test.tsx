import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { SiteTemplateInfo } from "@adminprop/shared-types"

import { makeTemplates } from "../../../../test/site-fixtures"
import { TemplatePicker } from "./template-picker"

function templates(): SiteTemplateInfo[] {
  const [classic, modern] = makeTemplates() as [
    SiteTemplateInfo,
    SiteTemplateInfo,
  ]
  return [
    classic,
    modern,
    { ...classic, key: "LUXURY", name: "Lujo", description: "Sobrio." },
  ]
}

describe("TemplatePicker", () => {
  it("usa la captura real de cada template cuando la API no manda miniatura", () => {
    render(
      <TemplatePicker
        templates={templates()}
        value="CLASSIC"
        onSelect={vi.fn()}
      />
    )
    expect(
      screen.getByAltText("Vista de ejemplo del template Clásico")
    ).toHaveAttribute("src", "/templates/classic.png")
    expect(
      screen.getByAltText("Vista de ejemplo del template Moderno")
    ).toHaveAttribute("src", "/templates/modern.png")
    expect(
      screen.getByAltText("Vista de ejemplo del template Lujo")
    ).toHaveAttribute("src", "/templates/luxury.png")
  })

  it("la miniatura de la API tiene prioridad sobre la captura incluida", () => {
    const list = templates().map((t) =>
      t.key === "MODERN"
        ? { ...t, previewImageUrl: "https://cdn.test/m.png" }
        : t
    )
    render(
      <TemplatePicker templates={list} value="CLASSIC" onSelect={vi.fn()} />
    )
    expect(
      screen.getByAltText("Vista de ejemplo del template Moderno")
    ).toHaveAttribute("src", "https://cdn.test/m.png")
  })

  it("si la imagen no carga, cae a la mini-maqueta y no deja un hueco roto", () => {
    render(
      <TemplatePicker
        templates={templates()}
        value="CLASSIC"
        onSelect={vi.fn()}
      />
    )
    fireEvent.error(
      screen.getByAltText("Vista de ejemplo del template Clásico")
    )
    expect(
      screen.queryByAltText("Vista de ejemplo del template Clásico")
    ).toBeNull()
    expect(screen.getByRole("radio", { name: /Clásico/ })).toHaveAttribute(
      "aria-checked",
      "true"
    )
  })

  it("elegir otro template avisa; el elegido no", () => {
    const onSelect = vi.fn()
    render(
      <TemplatePicker
        templates={templates()}
        value="CLASSIC"
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByRole("radio", { name: /Clásico/ }))
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("radio", { name: /Lujo/ }))
    expect(onSelect).toHaveBeenCalledWith("LUXURY")
  })
})
