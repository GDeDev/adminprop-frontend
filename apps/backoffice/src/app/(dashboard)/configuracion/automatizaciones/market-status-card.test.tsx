import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { MarketStatusDto } from "@adminprop/shared-types"

import { MarketStatusCard } from "./market-status-card"

let state: { isPending: boolean; isError: boolean; data?: MarketStatusDto }

vi.mock("@/lib/valuation-api", () => ({ useMarketStatus: () => state }))

describe("MarketStatusCard", () => {
  it("muestra el estado de cada fuente", () => {
    state = {
      isPending: false,
      isError: false,
      data: {
        maxAgeDays: 45,
        sources: [
          {
            source: "ZONAPROP",
            lastIngestAt: "2026-11-02T06:00:00Z",
            status: "OK",
            activeComparables: 120,
          },
          {
            source: "ARGENPROP",
            lastIngestAt: null,
            status: "PARSE_ERROR",
            activeComparables: 0,
          },
        ],
      },
    }
    render(<MarketStatusCard />)
    expect(screen.getByText("Zonaprop")).toBeInTheDocument()
    expect(screen.getByText("Al día")).toBeInTheDocument()
    expect(screen.getByText("Con error de lectura")).toBeInTheDocument()
    expect(screen.getByText(/Sin ingresos todavía/)).toBeInTheDocument()
    expect(screen.getByText(/hasta 45 días/)).toBeInTheDocument()
  })

  it("avisa si no se pudo cargar", () => {
    state = { isPending: false, isError: true }
    render(<MarketStatusCard />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cargar el estado"
    )
  })
})
