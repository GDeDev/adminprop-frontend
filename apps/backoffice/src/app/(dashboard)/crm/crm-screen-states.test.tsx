import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { PipelineDto } from "@adminprop/shared-types"

import { CrmScreen } from "./crm-screen"

const refetch = vi.fn()
let pipeline: Record<string, unknown> = {}

vi.mock("@adminprop/ui/hooks/use-media-query", () => ({
  useIsDesktop: () => true,
}))
vi.mock("@/lib/crm-api", () => ({
  usePipeline: () => pipeline,
  useAssignees: () => ({ data: [] }),
}))
vi.mock("./board", () => ({ Board: () => <div>tablero</div> }))
vi.mock("./stage-tabs", () => ({ StageTabs: () => <div>pestañas</div> }))
vi.mock("./crm-overview", () => ({ CrmOverview: () => null }))
vi.mock("./inquiry-drawer", () => ({ InquiryDrawer: () => null }))
vi.mock("./new-inquiry-dialog", () => ({
  NewInquiryDialog: ({ open }: { open: boolean }) =>
    open ? <div>alta de consulta</div> : null,
}))
vi.mock("./move-flow", () => ({
  useMoveFlow: () => ({ request: vi.fn(), dialogs: null }),
}))
vi.mock("@/components/property-select", () => ({
  PropertySelect: () => <div>selector de propiedad</div>,
}))

const empty: PipelineDto = {
  columns: (
    [
      "NEW",
      "CONTACTED",
      "VISIT_SCHEDULED",
      "PROPOSAL_SENT",
      "CLOSED_WON",
      "CLOSED_LOST",
    ] as const
  ).map((stage) => ({ stage, total: 0, cards: [] })),
}

afterEach(() => vi.clearAllMocks())

describe("CrmScreen", () => {
  it("cargando muestra el esqueleto y no el tablero", () => {
    pipeline = { isPending: true, isError: false, data: undefined }
    render(<CrmScreen />)
    expect(screen.queryByText("tablero")).toBeNull()
  })

  it("error: mensaje en español y reintento", async () => {
    pipeline = { isPending: false, isError: true, data: undefined, refetch }
    const user = userEvent.setup()
    render(<CrmScreen />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar las consultas."
    )
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("sin ninguna consulta y sin filtros: estado vacío con alta manual", async () => {
    pipeline = { isPending: false, isError: false, data: empty }
    const user = userEvent.setup()
    render(<CrmScreen />)
    expect(screen.getByText("Todavía no hay consultas")).toBeInTheDocument()
    expect(screen.queryByText("tablero")).toBeNull()
    await user.click(
      screen.getAllByRole("button", { name: "Nueva consulta" })[1]!
    )
    expect(screen.getByText("alta de consulta")).toBeInTheDocument()
  })

  it("con datos muestra el tablero", () => {
    pipeline = {
      isPending: false,
      isError: false,
      data: {
        columns: empty.columns.map((column, index) =>
          index === 0 ? { ...column, total: 1 } : column
        ),
      },
    }
    render(<CrmScreen />)
    expect(screen.getByText("tablero")).toBeInTheDocument()
  })
})
