import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

let pathname = "/_s/demo/propiedades"
vi.mock("next/navigation", () => ({ usePathname: () => pathname }))

import RootError from "../../error"
import PreviewError from "../../p/[site]/error"

import SiteError from "./error"

describe("pantalla de error del sitio", () => {
  it("avisa con tono amable, sin mostrar el mensaje técnico", () => {
    render(
      <SiteError
        error={Object.assign(new Error("La API respondió 503"), {
          digest: "abc123",
        })}
        retry={() => {}}
      />
    )
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /estamos teniendo un problema/i
    )
    expect(screen.queryByText(/503/)).toBeNull()
    expect(screen.getByText(/abc123/)).toBeInTheDocument()
  })

  it("«Reintentar» llama a retry (vuelve a pedir los datos), no a reset", async () => {
    const retry = vi.fn()
    const reset = vi.fn()
    render(<SiteError error={new Error("x")} retry={retry} {...{ reset }} />)
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(reset).not.toHaveBeenCalled()
  })

  it("el link al inicio conserva el prefijo del acceso por slug", () => {
    pathname = "/_s/demo/propiedades"
    render(<SiteError error={new Error("x")} retry={() => {}} />)
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/_s/demo"
    )
  })

  it("en un dominio propio el inicio es /", () => {
    pathname = "/propiedades"
    render(<SiteError error={new Error("x")} retry={() => {}} />)
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/"
    )
  })

  it("la raíz y la vista previa usan la misma pantalla", () => {
    expect(RootError).toBe(SiteError)
    expect(PreviewError).toBe(SiteError)
  })
})
