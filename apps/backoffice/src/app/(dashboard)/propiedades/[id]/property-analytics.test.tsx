import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { PropertyInquiryAnalytics } from "@adminprop/shared-types"

import { PropertyAnalytics } from "./property-analytics"

const refetch = vi.fn()
let state: Record<string, unknown> = {}
const usePropertyAnalytics = vi.fn<
  (propertyId: string, range: { from?: string; to?: string }) => unknown
>(() => state)

vi.mock("@/lib/crm-api", () => ({
  usePropertyAnalytics: (id: string, range: { from?: string; to?: string }) =>
    usePropertyAnalytics(id, range),
}))

const data: PropertyInquiryAnalytics = {
  views: 120,
  inquiries: 8,
  conversionRate: "12.5",
  byStage: {
    NEW: 5,
    CONTACTED: 2,
    VISIT_SCHEDULED: 0,
    PROPOSAL_SENT: 0,
    CLOSED_WON: 1,
    CLOSED_LOST: 0,
  },
  bySource: {
    PORTAL: 6,
    MERCADOLIBRE: 2,
    ZONAPROP: 0,
    ARGENPROP: 0,
    WHATSAPP: 0,
    PHONE: 0,
    MANUAL: 0,
  },
  daily: [
    { date: "2026-11-01", views: 60, inquiries: 3 },
    { date: "2026-11-02", views: 60, inquiries: 5 },
  ],
}

afterEach(() => {
  vi.clearAllMocks()
  state = {}
})

describe("PropertyAnalytics", () => {
  it("muestra cifras, gráficos, desglose y la aclaración de las vistas", () => {
    state = { isPending: false, isError: false, data, refetch }
    render(<PropertyAnalytics propertyId="p1" />)
    expect(screen.getByText("120")).toBeInTheDocument()
    expect(screen.getByText("12,5 %")).toBeInTheDocument()
    expect(screen.getAllByRole("img")).toHaveLength(2)
    const stages = screen.getByRole("region", { name: "Consultas por etapa" })
    expect(within(stages).getByText("Nueva")).toBeInTheDocument()
    const sources = screen.getByRole("region", { name: "Consultas por canal" })
    expect(within(sources).getByText("Portal propio")).toBeInTheDocument()
    expect(within(sources).queryByText("Zonaprop")).not.toBeInTheDocument()
    expect(screen.getByText(/fecha de activación/)).toBeInTheDocument()
  })

  it("al cambiar el período vuelve a pedir con el rango nuevo", async () => {
    state = { isPending: false, isError: false, data, refetch }
    const user = userEvent.setup()
    render(<PropertyAnalytics propertyId="p1" />)
    const first = usePropertyAnalytics.mock.calls[0]![1]
    await user.click(screen.getByRole("combobox", { name: "Período" }))
    await user.click(
      await screen.findByRole("option", { name: "Últimos 90 días" })
    )
    const last = usePropertyAnalytics.mock.calls.at(-1)![1]
    expect(last.to).toBe(first.to)
    expect(last.from! < first.from!).toBe(true)
    expect(screen.getByText(/Últimos 90 días\./)).toBeInTheDocument()
  })

  it("cargando muestra un esqueleto y sin cifras", () => {
    state = { isPending: true, isError: false }
    render(<PropertyAnalytics propertyId="p1" />)
    expect(screen.queryByText("Vistas")).not.toBeInTheDocument()
  })

  it("con error ofrece reintentar y no muestra el error crudo", async () => {
    state = {
      isPending: false,
      isError: true,
      error: new Error("ECONNRESET at socket 10.0.0.1"),
      refetch,
    }
    const user = userEvent.setup()
    render(<PropertyAnalytics propertyId="p1" />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar las analíticas."
    )
    expect(screen.queryByText(/ECONNRESET/)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("sin consultas ni vistas lo dice en cada bloque", () => {
    state = {
      isPending: false,
      isError: false,
      refetch,
      data: {
        ...data,
        views: 0,
        inquiries: 0,
        conversionRate: null,
        byStage: {},
        bySource: {},
        daily: [{ date: "2026-11-01", views: 0, inquiries: 0 }],
      },
    }
    render(<PropertyAnalytics propertyId="p1" />)
    expect(
      screen.getAllByText("Todavía no hay consultas en el período.")
    ).toHaveLength(2)
    expect(
      screen.getByRole("img", {
        name: "Vistas por día: sin vistas en el período.",
      })
    ).toBeInTheDocument()
  })
})
