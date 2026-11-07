import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError } from "axios"
import { toast } from "sonner"
import { afterEach, describe, expect, it, vi } from "vitest"

import { BatchScreen } from "./batch-screen"
import { MigrationScreen } from "./migration-screen"
import { TokkoCard, parseLimit } from "./tokko-card"

const push = vi.fn()
const replace = vi.fn()
const analyze = vi.fn()
let role = "ADMIN"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } }),
}))
vi.mock("@/lib/migration-api", () => {
  const infinite = () => ({
    isPending: true,
    isError: false,
    data: undefined,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  })
  return {
    useAnalyzeTokko: () => ({
      mutateAsync: analyze,
      isPending: false,
      isError: false,
      error: null,
    }),
    useAnalyzeExcel: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    }),
    downloadExcelTemplate: vi.fn(),
    useBatch: () => ({ isPending: true, isError: false, data: undefined }),
    useBatches: infinite,
    useInfiniteBatches: infinite,
  }
})

afterEach(() => {
  role = "ADMIN"
  vi.clearAllMocks()
})

describe("gate de administradores", () => {
  it("MigrationScreen: un empleado ve el aviso y nada más", () => {
    role = "EMPLOYEE"
    render(<MigrationScreen />)
    expect(screen.getByText("Solo para administradores")).toBeInTheDocument()
    expect(screen.queryByText("Migración de datos")).not.toBeInTheDocument()
    expect(screen.queryByText("Desde Tokko")).not.toBeInTheDocument()
  })

  it("MigrationScreen: un administrador ve el título y las tarjetas", () => {
    render(<MigrationScreen />)
    expect(
      screen.getByRole("heading", { name: "Migración de datos" })
    ).toBeInTheDocument()
    expect(screen.getByText("Desde Tokko")).toBeInTheDocument()
    expect(
      screen.queryByText("Solo para administradores")
    ).not.toBeInTheDocument()
  })

  it("BatchScreen: un empleado ve el aviso y no el lote", () => {
    role = "EMPLOYEE"
    render(<BatchScreen id="b1" jobId={null} />)
    expect(screen.getByText("Solo para administradores")).toBeInTheDocument()
    expect(screen.queryByText("Migración de datos")).not.toBeInTheDocument()
  })

  it("BatchScreen: un administrador ve la pantalla del lote", () => {
    render(<BatchScreen id="b1" jobId={null} />)
    expect(screen.getByText("Migración de datos")).toBeInTheDocument()
    expect(
      screen.queryByText("Solo para administradores")
    ).not.toBeInTheDocument()
  })
})

describe("TokkoCard", () => {
  const submit = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole("button", { name: "Analizar Tokko" }))

  it("sin límite manda includeAssets y navega al lote", async () => {
    analyze.mockResolvedValue({ batchId: "b1", jobId: "j1" })
    const user = userEvent.setup()
    render(<TokkoCard />)
    await submit(user)
    await waitFor(() =>
      expect(analyze).toHaveBeenCalledWith({ includeAssets: true })
    )
    expect(push).toHaveBeenCalledWith("/configuracion/migracion/b1?job=j1")
  })

  it("manda el límite y puede excluir las fotos", async () => {
    analyze.mockResolvedValue({ batchId: "b1", jobId: "j1" })
    const user = userEvent.setup()
    render(<TokkoCard />)
    await user.type(screen.getByLabelText(/Cantidad máxima/), "25")
    await user.click(screen.getByRole("checkbox", { name: "Incluir fotos" }))
    await submit(user)
    await waitFor(() =>
      expect(analyze).toHaveBeenCalledWith({ includeAssets: false, limit: 25 })
    )
  })

  it.each(["abc", "0"])("con %s no envía y marca el campo", async (value) => {
    const user = userEvent.setup()
    render(<TokkoCard />)
    const input = screen.getByLabelText(/Cantidad máxima/)
    await user.type(input, value)
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent(/entero mayor que 0/)
    await submit(user)
    expect(analyze).not.toHaveBeenCalled()
  })

  it("si Tokko no está habilitado avisa con toast y no navega", async () => {
    analyze.mockRejectedValue(
      new AxiosError("x", "403", undefined, undefined, {
        status: 403,
        statusText: "Forbidden",
        headers: {},
        config: {} as never,
        data: { code: "TOKKO_NOT_ENABLED", message: "no" },
      })
    )
    const user = userEvent.setup()
    render(<TokkoCard />)
    await submit(user)
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "La importación desde Tokko no está habilitada para esta inmobiliaria."
      )
    )
    expect(push).not.toHaveBeenCalled()
  })
})

describe("parseLimit", () => {
  it("vacío es sin límite; un entero positivo pasa; el resto es inválido", () => {
    expect(parseLimit("")).toBeUndefined()
    expect(parseLimit("25")).toBe(25)
    expect(parseLimit("0")).toBe("invalid")
    expect(parseLimit("abc")).toBe("invalid")
    expect(parseLimit("-1")).toBe("invalid")
  })
})
