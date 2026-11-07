import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { IndexStatus } from "@adminprop/shared-types"

import { IndexStatusPanel } from "./index-status"

const mutateAsync = vi.fn()
let isPending = false

const statuses: IndexStatus[] = [
  {
    indexType: "ICL",
    latestPeriod: "2026-09",
    latestValue: "1234.5",
    source: "bcra",
    lastAttemptAt: "2026-10-02T12:00:00.000Z",
    lastAttemptStatus: "SUCCEEDED",
    lastAttemptError: null,
    provider: "bcra-indec",
  },
  {
    indexType: "IPC",
    latestPeriod: null,
    latestValue: null,
    source: null,
    lastAttemptAt: null,
    lastAttemptStatus: "FAILED",
    lastAttemptError: "El INDEC no respondió",
    provider: "manual",
  },
]

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@/lib/automations-api", () => ({
  useIndexStatus: () => ({ isPending: false, isError: false, data: statuses }),
  useRunJob: () => ({ mutateAsync, isPending }),
}))

afterEach(() => {
  isPending = false
  vi.clearAllMocks()
})

describe("IndexStatusPanel", () => {
  it("muestra el estado de cada índice", () => {
    render(<IndexStatusPanel canRun />)
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent(
      "ICLúltimo mes cargado: 09/2026 (bcra) · último intento:"
    )
    expect(items[0]).toHaveTextContent("Actualizado")
    expect(items[1]).toHaveTextContent("sin valores cargados · carga manual")
    expect(items[1]).toHaveTextContent("Falló")
    expect(items[1]).toHaveTextContent("El INDEC no respondió")
  })

  it("Traer ahora encola indices.fetch y avisa", async () => {
    mutateAsync.mockResolvedValue({})
    const user = userEvent.setup()
    render(<IndexStatusPanel canRun />)
    await user.click(screen.getByRole("button", { name: "Traer ahora" }))
    expect(mutateAsync).toHaveBeenCalledWith({ job: "indices.fetch" })
    expect(toast.success).toHaveBeenCalled()
  })

  it("avisa con toast si falla", async () => {
    mutateAsync.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<IndexStatusPanel canRun />)
    await user.click(screen.getByRole("button", { name: "Traer ahora" }))
    expect(toast.error).toHaveBeenCalledWith("No se pudo encolar la búsqueda.")
  })

  it("deshabilita el botón mientras corre", () => {
    isPending = true
    render(<IndexStatusPanel canRun />)
    expect(screen.getByRole("button", { name: "Traer ahora" })).toBeDisabled()
  })

  it("sin permiso no hay botón", () => {
    render(<IndexStatusPanel canRun={false} />)
    expect(
      screen.queryByRole("button", { name: "Traer ahora" })
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })
})
