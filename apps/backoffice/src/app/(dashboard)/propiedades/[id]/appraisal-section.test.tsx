import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  MarketCoverageDto,
  Paginated,
  ValuationResult,
} from "@adminprop/shared-types"

import { AppraisalSection } from "./appraisal-section"

const appraise = vi.fn()
let history: Paginated<ValuationResult>
let coverage: MarketCoverageDto

vi.mock("@/lib/valuation-api", () => ({
  useValuationHistory: () => ({
    isPending: false,
    isError: false,
    data: history,
  }),
  useMarketCoverage: () => ({ data: coverage }),
  useAppraiseProperty: () => ({ mutateAsync: appraise, isPending: false }),
}))

const result = (extra: Partial<ValuationResult> = {}): ValuationResult => ({
  id: "v1",
  propertyId: "p1",
  currency: "ARS",
  minPrice: "400000.00",
  maxPrice: "520000.00",
  suggestedPrice: "452300.50",
  suggestedPriceRounded: "452300.00",
  confidence: "MEDIUM",
  comparablesUsed: 8,
  comparablesDiscarded: 2,
  zoneLabel: "Palermo, CABA",
  zoneWidened: false,
  oldestComparableAt: "2026-10-20T00:00:00Z",
  justification: "Basado en 8 avisos de alquiler en Palermo.",
  engine: "STATISTICAL",
  requestedBy: { id: "u1", fullName: "Micaela Pérez" },
  createdAt: "2026-11-02T15:00:00Z",
  reused: false,
  ...extra,
})

const emptyHistory = (): Paginated<ValuationResult> => ({
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("AppraisalSection", () => {
  it("lista el historial con quién tasó y el rango", () => {
    history = { ...emptyHistory(), data: [result()] }
    coverage = {
      zoneLabel: "Palermo, CABA",
      activeComparables: 20,
      enoughData: true,
      lastRefreshedAt: null,
    }
    render(<AppraisalSection propertyId="p1" locationId="l1" />)
    expect(screen.getByText("Confianza media")).toBeInTheDocument()
    expect(screen.getByText(/Micaela Pérez/)).toBeInTheDocument()
    expect(screen.getByText(/Rango/)).toBeInTheDocument()
  })

  it("sin tasaciones, lo dice", () => {
    history = emptyHistory()
    render(<AppraisalSection propertyId="p1" locationId="l1" />)
    expect(screen.getByText(/Todavía no se tasó/)).toBeInTheDocument()
  })

  it("calcula, muestra el resultado y usa el precio sin guardar", async () => {
    history = emptyHistory()
    coverage = {
      zoneLabel: "Palermo, CABA",
      activeComparables: 1,
      enoughData: false,
      lastRefreshedAt: null,
    }
    appraise.mockResolvedValue(result())
    const onUse = vi.fn()
    const user = userEvent.setup()
    render(<AppraisalSection propertyId="p1" locationId="l1" onUse={onUse} />)

    await user.click(screen.getByRole("button", { name: /Sugerir precio/ }))
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Todavía hay pocos datos de esta zona"
    )
    await user.type(screen.getByLabelText("Superficie (m²)"), "52,5")
    await user.click(screen.getByRole("button", { name: "Calcular" }))

    expect(appraise).toHaveBeenCalledWith({ areaM2: "52.5" })
    expect(await screen.findByText(/452\.300/)).toBeInTheDocument()
    expect(screen.getByText("Confianza media")).toBeInTheDocument()
    expect(screen.getByText(/Basado en 8 avisos/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Usar este precio" }))
    expect(onUse).toHaveBeenCalledWith("452300.50", "ARS")
  })

  it("muestra el mensaje de la API ante un 422 sin pantalla de error", async () => {
    history = emptyHistory()
    coverage = {
      zoneLabel: "Palermo, CABA",
      activeComparables: 5,
      enoughData: true,
      lastRefreshedAt: null,
    }
    appraise.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<AppraisalSection propertyId="p1" locationId="l1" />)
    await user.click(screen.getByRole("button", { name: /Sugerir precio/ }))
    await user.click(await screen.findByRole("button", { name: "Calcular" }))
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No se pudo calcular la sugerencia."
      )
    )
  })

  it("no manda un pedido con superficie inválida", async () => {
    history = emptyHistory()
    coverage = {
      zoneLabel: "x",
      activeComparables: 5,
      enoughData: true,
      lastRefreshedAt: null,
    }
    const user = userEvent.setup()
    render(<AppraisalSection propertyId="p1" locationId="l1" />)
    await user.click(screen.getByRole("button", { name: /Sugerir precio/ }))
    await user.type(await screen.findByLabelText("Superficie (m²)"), "abc")
    await user.click(screen.getByRole("button", { name: "Calcular" }))
    expect(appraise).not.toHaveBeenCalled()
    expect(screen.getByText(/Ingresá la superficie/)).toBeInTheDocument()
  })
})
