import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { CrmOverviewDto } from "@adminprop/shared-types"

import { CrmOverview } from "./crm-overview"

const refetch = vi.fn()
let state: Record<string, unknown> = {}
const useCrmOverview = vi.fn<
  (range: { from?: string; to?: string }) => unknown
>(() => state)

vi.mock("@/lib/crm-api", () => ({
  useCrmOverview: (range: { from?: string; to?: string }) =>
    useCrmOverview(range),
}))

const data: CrmOverviewDto = {
  openCount: 9,
  unassignedCount: 3,
  averageFirstContactHours: 4.5,
  conversionRate: "10.0",
  byStage: {
    NEW: 4,
    CONTACTED: 3,
    VISIT_SCHEDULED: 2,
    PROPOSAL_SENT: 0,
    CLOSED_WON: 1,
    CLOSED_LOST: 0,
  },
  bySource: {
    PORTAL: 5,
    MERCADOLIBRE: 0,
    ZONAPROP: 0,
    ARGENPROP: 0,
    WHATSAPP: 5,
    PHONE: 0,
    MANUAL: 0,
  },
  topProperties: [
    { propertyId: "p1", address: "Mitre 100", inquiries: 4, views: 30 },
  ],
}

afterEach(() => {
  vi.clearAllMocks()
  state = {}
})

describe("CrmOverview", () => {
  it("muestra las cifras y, desplegada, la analítica con la aclaración de vistas", async () => {
    state = { isPending: false, isError: false, data, refetch }
    const user = userEvent.setup()
    render(<CrmOverview />)
    expect(screen.getByText("Abiertas").nextSibling).toHaveTextContent("9")
    expect(screen.getByText("4,5 h")).toBeInTheDocument()
    expect(screen.getByText("10,0 %")).toBeInTheDocument()

    await user.click(screen.getByText(/Analítica: etapas, canales/))
    const stages = screen.getByRole("region", { name: "Consultas por etapa" })
    expect(within(stages).getAllByRole("listitem")).toHaveLength(6)
    const sources = screen.getByRole("region", { name: "Consultas por canal" })
    expect(within(sources).getAllByRole("listitem")).toHaveLength(2)
    expect(screen.getByRole("link", { name: /Mitre 100/ })).toHaveAttribute(
      "href",
      "/propiedades/p1"
    )
    expect(screen.getByText(/fecha de activación/)).toBeInTheDocument()
  })

  it("pide el rango elegido", async () => {
    state = { isPending: false, isError: false, data, refetch }
    const user = userEvent.setup()
    render(<CrmOverview />)
    const first = useCrmOverview.mock.calls[0]![0]
    await user.click(screen.getByText(/Analítica: etapas, canales/))
    await user.click(screen.getByRole("combobox", { name: "Período" }))
    await user.click(
      await screen.findByRole("option", { name: "Últimos 7 días" })
    )
    const last = useCrmOverview.mock.calls.at(-1)![0]
    expect(last.from! > first.from!).toBe(true)
  })

  it("con error avisa en español y permite reintentar", async () => {
    state = {
      isPending: false,
      isError: true,
      error: new Error("Request failed with status code 500"),
      refetch,
    }
    const user = userEvent.setup()
    render(<CrmOverview />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cargar el resumen de consultas."
    )
    expect(screen.queryByText(/status code/)).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })
})
