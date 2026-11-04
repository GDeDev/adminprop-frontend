import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { makeCard } from "@/test-utils/crm-fixtures"

import { InquiryCardView } from "./inquiry-card"

vi.mock("@/lib/crm-api", () => ({
  useContactAttempt: () => ({ mutateAsync: vi.fn() }),
  fetchWhatsAppLink: vi.fn(),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

afterEach(() => vi.clearAllMocks())

describe("InquiryCardView", () => {
  it("muestra propiedad, canal, antigüedad y quién la tiene asignada", () => {
    render(
      <InquiryCardView
        card={makeCard("a", "NEW", {
          property: { id: "p", address: "Mitre 100" },
          source: "MERCADOLIBRE",
          ageHours: 50,
          assignedTo: { id: "u1", fullName: "Ana Pérez" },
        })}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText("Mitre 100")).toBeInTheDocument()
    expect(screen.getByText("Mercado Libre")).toBeInTheDocument()
    expect(screen.getByText("Hace 2 d")).toBeInTheDocument()
    expect(screen.getByLabelText("Asignada a Ana Pérez")).toHaveTextContent(
      "AP"
    )
  })

  it("sin asignar no muestra avatar", () => {
    render(<InquiryCardView card={makeCard("a", "NEW")} onOpen={vi.fn()} />)
    expect(screen.queryByLabelText(/Asignada a/)).toBeNull()
  })

  it("el seguimiento vencido se dice con texto, no sólo con color", () => {
    render(
      <InquiryCardView
        card={makeCard("a", "NEW", { nextActionAt: "2000-01-01" })}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText("Seguimiento vencido")).toBeInTheDocument()
  })

  it("una consulta cerrada no marca seguimiento vencido", () => {
    render(
      <InquiryCardView
        card={makeCard("a", "CLOSED_LOST", { nextActionAt: "2000-01-01" })}
        onOpen={vi.fn()}
      />
    )
    expect(screen.queryByText("Seguimiento vencido")).toBeNull()
  })

  it("abrir el detalle desde el nombre", async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<InquiryCardView card={makeCard("a", "NEW")} onOpen={onOpen} />)
    await user.click(screen.getByText("Cliente a"))
    expect(onOpen).toHaveBeenCalledWith("a")
  })

  it("el menú «Mover a…» de escritorio excluye la etapa actual y avisa la elegida", async () => {
    const onMoveMenu = vi.fn()
    const user = userEvent.setup()
    render(
      <InquiryCardView
        card={makeCard("a", "CONTACTED")}
        onOpen={vi.fn()}
        onMoveMenu={onMoveMenu}
      />
    )
    await user.click(
      screen.getByRole("button", { name: "Mover a… (Cliente a)" })
    )
    expect(screen.queryByRole("menuitem", { name: "Contactada" })).toBeNull()
    expect(screen.getAllByRole("menuitem")).toHaveLength(5)
    await user.click(await screen.findByRole("menuitem", { name: "Perdida" }))
    expect(onMoveMenu).toHaveBeenCalledWith("CLOSED_LOST")
  })

  it("sin handlers de movimiento no ofrece ningún control de mover", () => {
    render(<InquiryCardView card={makeCard("a", "NEW")} onOpen={vi.fn()} />)
    expect(screen.queryByRole("button", { name: /Mover/ })).toBeNull()
    expect(screen.queryByRole("combobox")).toBeNull()
  })
})
