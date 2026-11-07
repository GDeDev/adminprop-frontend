import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AuditEntry, AuditEntryDetail } from "@adminprop/shared-types"

import { AuditScreen } from "./audit-screen"

let role: "ADMIN" | "EMPLOYEE" = "ADMIN"
let state: { isPending: boolean; isError: boolean; entries: AuditEntry[] }
let hasNextPage = false
const auditQuery = vi.fn()
const refetch = vi.fn()
const fetchNextPage = vi.fn()
const download = vi.fn()
const detailById: Record<string, AuditEntryDetail> = {}

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@adminprop/session/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@adminprop/session/client")>()
  return { ...actual, useSession: () => ({ user: { id: "u1", role } }) }
})

vi.mock("@/lib/reports-api", () => ({
  downloadExport: (...args: unknown[]) => download(...args),
}))

vi.mock("@/lib/audit-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audit-api")>()
  return {
    auditParams: actual.auditParams,
    useAuditCatalog: () => ({ data: { entities: ["Contract", "Property"] } }),
    useAuditEntry: (id: string) => ({
      isPending: false,
      isError: false,
      data: detailById[id],
      refetch: vi.fn(),
    }),
    useInfiniteAudit: (filters: unknown) => {
      auditQuery(filters)
      return {
        isPending: state.isPending,
        isError: state.isError,
        refetch,
        data: {
          pages: [
            {
              data: state.entries,
              pagination: {
                page: 1,
                limit: 25,
                total: state.entries.length,
                totalPages: 1,
                hasNextPage,
                hasPreviousPage: false,
              },
            },
          ],
        },
        hasNextPage,
        isFetchingNextPage: false,
        fetchNextPage,
      }
    },
  }
})

const entry: AuditEntry = {
  id: "e1",
  entity: "Contract",
  entityId: "c1",
  action: "UPDATE",
  summary: "Cambió el estado del contrato",
  actorKind: "USER",
  userId: "u2",
  userEmail: "ana@oppido.test",
  userName: "Ana Pérez",
  ip: null,
  createdAt: "2026-10-15T13:30:00.000Z",
}

const detail: AuditEntryDetail = {
  ...entry,
  changes: [
    { field: "status", before: "DRAFT", after: "ACTIVE" },
    { field: "depositMonths", before: "100000.00", after: "120000.00" },
    {
      field: "propertyId",
      before: "p1",
      after: "p2",
      beforeLabel: "Mitre 100",
      afterLabel: "Sarmiento 200",
    },
  ],
}

beforeEach(() => {
  role = "ADMIN"
  hasNextPage = false
  state = { isPending: false, isError: false, entries: [entry] }
  detailById.e1 = detail
})

afterEach(() => {
  vi.clearAllMocks()
})

function lastFilters() {
  return auditQuery.mock.lastCall?.[0]
}

describe("AuditScreen", () => {
  it("lista las filas con entidad, acción, usuario y fecha", () => {
    render(<AuditScreen />)
    const row = screen.getByRole("button", {
      name: /Cambió el estado del contrato/,
    })
    const date = new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(entry.createdAt))
    expect(row).toHaveTextContent("Contrato")
    expect(row).toHaveTextContent("Modificación")
    expect(row).toHaveTextContent("Ana Pérez")
    expect(row).toHaveTextContent(date)
    expect(row).toHaveAttribute("aria-expanded", "false")
  })

  it("expandir una fila muestra el diff campo por campo con etiquetas legibles", async () => {
    const user = userEvent.setup()
    render(<AuditScreen />)
    await user.click(
      screen.getByRole("button", { name: /Cambió el estado del contrato/ })
    )
    expect(
      screen.getByRole("button", { name: /Cambió el estado del contrato/ })
    ).toHaveAttribute("aria-expanded", "true")

    expect(await screen.findByText("Antes")).toBeInTheDocument()
    expect(screen.getByText("Después")).toBeInTheDocument()
    expect(screen.getByText("Estado")).toBeInTheDocument()
    expect(screen.getByText("DRAFT")).toBeInTheDocument()
    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
    // Campo sin etiqueta conocida: se "humaniza".
    expect(screen.getByText("Deposit months")).toBeInTheDocument()
    // Con etiqueta de id resuelta se muestra el nombre, no el id.
    expect(screen.getByText("Mitre 100")).toBeInTheDocument()
    expect(screen.getByText("Sarmiento 200")).toBeInTheDocument()
    expect(screen.queryByText("p1")).toBeNull()
    expect(screen.getByRole("link", { name: "Ver contrato" })).toHaveAttribute(
      "href",
      "/contratos/c1"
    )
  })

  it("una entrada sin cambios de campos lo dice", async () => {
    detailById.e1 = { ...detail, changes: [] }
    const user = userEvent.setup()
    render(<AuditScreen />)
    await user.click(
      screen.getByRole("button", { name: /Cambió el estado del contrato/ })
    )
    expect(
      await screen.findByText("Sin cambios de campos para mostrar.")
    ).toBeInTheDocument()
  })

  it("los filtros de entidad, acción, texto, desde y hasta llegan a la query", async () => {
    const user = userEvent.setup()
    render(<AuditScreen />)
    expect(lastFilters()).toEqual({
      entity: undefined,
      entityId: undefined,
      search: undefined,
    })

    await user.click(screen.getByRole("combobox", { name: "Entidad" }))
    await user.click(await screen.findByRole("option", { name: "Propiedad" }))
    await waitFor(() => expect(lastFilters().entity).toBe("Property"))

    await user.click(screen.getByRole("combobox", { name: "Acción" }))
    await user.click(
      await screen.findByRole("option", { name: "Modificación" })
    )
    await waitFor(() => expect(lastFilters().action).toBe("UPDATE"))

    await user.type(screen.getByLabelText("Desde"), "2026-10-01")
    await user.type(screen.getByLabelText("Hasta"), "2026-10-31")
    await user.type(screen.getByLabelText("Buscar"), "estado")

    // El texto se envía recién tras el debounce.
    await waitFor(() =>
      expect(lastFilters()).toMatchObject({
        entity: "Property",
        action: "UPDATE",
        from: "2026-10-01",
        to: "2026-10-31",
        search: "estado",
      })
    )
  })

  it("no corrige ni rechaza un desde posterior a hasta: lo manda tal cual", async () => {
    // Documenta el comportamiento actual: la pantalla no valida el orden.
    const user = userEvent.setup()
    render(<AuditScreen />)
    await user.type(screen.getByLabelText("Desde"), "2026-11-30")
    await user.type(screen.getByLabelText("Hasta"), "2026-11-01")
    await waitFor(() =>
      expect(lastFilters()).toMatchObject({
        from: "2026-11-30",
        to: "2026-11-01",
      })
    )
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("exportar descarga en Excel con los filtros vigentes y no ofrece PDF ni CSV", async () => {
    download.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<AuditScreen />)
    await user.click(screen.getByRole("combobox", { name: "Entidad" }))
    await user.click(await screen.findByRole("option", { name: "Contrato" }))
    await waitFor(() => expect(lastFilters().entity).toBe("Contract"))
    await user.type(screen.getByLabelText("Desde"), "2026-10-01")

    await user.click(screen.getByRole("button", { name: /Excel/ }))
    expect(download).toHaveBeenCalledWith(
      "/audit/export",
      { entity: "Contract", from: "2026-10-01" },
      "xlsx",
      "auditoria"
    )
    expect(screen.queryByRole("button", { name: /PDF|CSV/i })).toBeNull()
  })

  it("sin movimientos muestra el estado vacío", () => {
    state = { isPending: false, isError: false, entries: [] }
    render(<AuditScreen />)
    expect(screen.getByText("Sin movimientos")).toBeInTheDocument()
    expect(
      screen.getByText("No hay registros con esos filtros.")
    ).toBeInTheDocument()
  })

  it("un error muestra el estado de error y reintentar vuelve a consultar", async () => {
    state = { isPending: false, isError: true, entries: [] }
    const user = userEvent.setup()
    render(<AuditScreen />)
    expect(
      screen.getByText("No se pudo cargar la auditoría")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Reintentar/i }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it("no hay paginación anterior/siguiente: 'Cargar más' pide la página siguiente", async () => {
    hasNextPage = true
    const user = userEvent.setup()
    render(<AuditScreen />)
    expect(screen.queryByRole("button", { name: /anterior/i })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Cargar más" }))
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it("sin más páginas no ofrece 'Cargar más'", () => {
    render(<AuditScreen />)
    expect(screen.queryByRole("button", { name: "Cargar más" })).toBeNull()
  })

  it("un empleado ve 'Solo para administradores' y no la lista", () => {
    role = "EMPLOYEE"
    render(<AuditScreen />)
    expect(screen.getByText("Solo para administradores")).toBeInTheDocument()
    expect(screen.queryByText("Cambió el estado del contrato")).toBeNull()
    expect(screen.queryByRole("button", { name: /Excel/ })).toBeNull()
  })

  it("el admin ve el botón de exportar y los filtros", () => {
    render(<AuditScreen />)
    const filters = screen.getByLabelText("Buscar").parentElement!
    expect(within(filters).getByLabelText("Desde")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Excel/ })).toBeInTheDocument()
  })
})
