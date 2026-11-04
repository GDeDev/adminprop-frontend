import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { makeCard, makePipeline } from "@/test-utils/crm-fixtures"

import { CrmScreen } from "./crm-screen"

const refetch = vi.fn()
let desktop = false
let pipelineState: Record<string, unknown> = {}
const usePipeline = vi.fn<(filters: Record<string, unknown>) => unknown>(
  () => pipelineState
)

vi.mock("@adminprop/ui/hooks/use-media-query", () => ({
  useIsDesktop: () => desktop,
}))
vi.mock("@/lib/crm-api", () => ({
  usePipeline: (filters: Record<string, unknown>) => usePipeline(filters),
  useAssignees: () => ({
    data: [{ id: "u1", fullName: "Ana Pérez", role: "EMPLOYEE" }],
  }),
  useInfiniteInquiries: () => ({
    data: undefined,
    hasNextPage: false,
    isFetching: false,
    isError: false,
    fetchNextPage: vi.fn(),
  }),
  useContactAttempt: () => ({ mutateAsync: vi.fn() }),
  fetchWhatsAppLink: vi.fn(),
  useCreateInquiry: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock("./crm-overview", () => ({ CrmOverview: () => null }))
vi.mock("./inquiry-drawer", () => ({ InquiryDrawer: () => null }))
vi.mock("./move-flow", () => ({
  useMoveFlow: () => ({ request: vi.fn(), dialogs: null }),
}))
vi.mock("@/components/property-select", () => ({
  PropertySelect: ({
    onChange,
  }: {
    onChange: (value: string | null) => void
  }) => (
    <button type="button" onClick={() => onChange("p1")}>
      elegir propiedad
    </button>
  ),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const loaded = () => ({
  isPending: false,
  isError: false,
  refetch,
  data: makePipeline({ NEW: [makeCard("a", "NEW")] }),
})
const lastFilters = () => usePipeline.mock.calls.at(-1)![0]

afterEach(() => {
  vi.clearAllMocks()
  desktop = false
  pipelineState = {}
})

describe("filtros del tablero", () => {
  it("sin filtros pide todo", () => {
    pipelineState = loaded()
    render(<CrmScreen />)
    expect(lastFilters()).toEqual({})
  })

  it("«Sin asignar» pide unassigned y no un asignado", async () => {
    pipelineState = loaded()
    const user = userEvent.setup()
    render(<CrmScreen />)
    await user.click(screen.getByRole("combobox", { name: "Asignado a" }))
    await user.click(await screen.findByRole("option", { name: "Sin asignar" }))
    expect(lastFilters()).toEqual({ unassigned: true })
  })

  it("un asignado concreto pide assignedToId", async () => {
    pipelineState = loaded()
    const user = userEvent.setup()
    render(<CrmScreen />)
    await user.click(screen.getByRole("combobox", { name: "Asignado a" }))
    await user.click(await screen.findByRole("option", { name: "Ana Pérez" }))
    expect(lastFilters()).toEqual({ assignedToId: "u1" })
  })

  it("canal y propiedad se suman al resto de los filtros", async () => {
    pipelineState = loaded()
    const user = userEvent.setup()
    render(<CrmScreen />)
    await user.click(screen.getByRole("combobox", { name: "Canal" }))
    await user.click(await screen.findByRole("option", { name: "WhatsApp" }))
    await user.click(screen.getByRole("button", { name: "elegir propiedad" }))
    expect(lastFilters()).toEqual({ source: "WHATSAPP", propertyId: "p1" })
  })

  it("la búsqueda espera a que termines de escribir y descarta los espacios", async () => {
    pipelineState = loaded()
    const user = userEvent.setup()
    render(<CrmScreen />)
    await user.type(
      screen.getByRole("searchbox", { name: "Buscar consultas" }),
      "  lopez "
    )
    await waitFor(() => expect(lastFilters()).toEqual({ q: "lopez" }))
    // Mientras se escribía no se pidió una búsqueda por cada letra.
    const withQ = usePipeline.mock.calls.filter(([f]) => f.q !== undefined)
    expect(withQ.every(([f]) => f.q === "lopez")).toBe(true)
  })

  it("volver a «Todos» saca el filtro", async () => {
    pipelineState = loaded()
    const user = userEvent.setup()
    render(<CrmScreen />)
    await user.click(screen.getByRole("combobox", { name: "Asignado a" }))
    await user.click(await screen.findByRole("option", { name: "Sin asignar" }))
    await user.click(screen.getByRole("combobox", { name: "Asignado a" }))
    await user.click(
      await screen.findByRole("option", { name: "Todos los asignados" })
    )
    expect(lastFilters()).toEqual({})
  })
})

describe("estados de la pantalla", () => {
  it("cargando muestra el esqueleto y ninguna columna", () => {
    pipelineState = { isPending: true, isError: false }
    render(<CrmScreen />)
    expect(screen.queryByRole("tab")).toBeNull()
    expect(screen.queryByText("Cliente a")).toBeNull()
  })

  it("con error avisa sin mostrar el error crudo y permite reintentar", async () => {
    pipelineState = {
      isPending: false,
      isError: true,
      error: new Error("connect ECONNREFUSED 10.0.0.5:3000"),
      refetch,
    }
    const user = userEvent.setup()
    render(<CrmScreen />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar las consultas."
    )
    expect(screen.queryByText(/ECONNREFUSED/)).toBeNull()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("en mobile muestra pestañas por etapa y en escritorio el tablero", () => {
    pipelineState = loaded()
    const { unmount } = render(<CrmScreen />)
    expect(screen.getAllByRole("tab")).toHaveLength(6)
    expect(
      screen.queryByRole("button", { name: /Mover la consulta/ })
    ).toBeNull()
    unmount()

    desktop = true
    render(<CrmScreen />)
    expect(screen.queryByRole("tab")).toBeNull()
    expect(
      screen.getByRole("button", { name: "Mover la consulta de Cliente a" })
    ).toBeInTheDocument()
  })

  it("una etapa sin consultas muestra el estado vacío en mobile", () => {
    pipelineState = {
      ...loaded(),
      data: makePipeline(),
    }
    render(<CrmScreen />)
    expect(screen.getByText("Sin consultas en esta etapa")).toBeInTheDocument()
  })

  it("«Nueva consulta» abre el alta manual", async () => {
    pipelineState = loaded()
    const user = userEvent.setup()
    render(<CrmScreen />)
    await user.click(screen.getByRole("button", { name: "Nueva consulta" }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})
