import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { IndexValue, User } from "@adminprop/shared-types"

import { IndicesScreen } from "./indices-screen"

let role: User["role"] = "ADMIN"
const register = vi.fn()

const values: IndexValue[] = [
  {
    id: "i2",
    indexType: "ICL",
    period: "2026-03",
    value: "1234.567890",
    source: "manual",
    createdAt: "2026-04-02T12:00:00.000Z",
  },
  {
    id: "i1",
    indexType: "ICL",
    period: "2026-02",
    value: "1200.000000",
    source: "manual",
    createdAt: "2026-03-02T12:00:00.000Z",
  },
]

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } as User }),
}))
vi.mock("@/lib/automations-api", () => ({
  useIndexStatus: () => ({ isPending: false, isError: false, data: [] }),
  useRunJob: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock("@/lib/contracts-api", () => ({
  useIndexValues: (type: string) => ({
    isPending: false,
    isError: false,
    data: type === "ICL" ? values : [],
  }),
  useRegisterIndexValue: () => ({ mutateAsync: register, isPending: false }),
}))

afterEach(() => {
  role = "ADMIN"
  vi.clearAllMocks()
})

describe("IndicesScreen", () => {
  it("lista los valores del índice por mes, del más reciente al más viejo", () => {
    render(<IndicesScreen />)

    const table = screen.getByRole("table", { name: "Valores de ICL" })
    const rows = within(table).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByText("03/2026")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("1234.567890")).toBeInTheDocument()
    expect(within(rows[1]!).getByText("02/2026")).toBeInTheDocument()
  })

  it("un administrador carga un valor; el mes y el valor se validan", async () => {
    register.mockResolvedValue({
      id: "i3",
      indexType: "ICL",
      period: "2026-04",
      value: "1300",
    })
    render(<IndicesScreen />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Cargar" }))
    expect(
      await screen.findByText("Ingresá el mes como AAAA-MM.")
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Mes"), "2026-04")
    await user.type(screen.getByLabelText("Valor"), "1300,5")
    await user.click(screen.getByRole("button", { name: "Cargar" }))

    expect(register).toHaveBeenCalledWith({
      indexType: "ICL",
      period: "2026-04",
      value: "1300.5",
    })
  })

  it("un empleado ve los valores pero no el formulario", () => {
    role = "EMPLOYEE"
    render(<IndicesScreen />)

    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(
      screen.queryByRole("form", { name: "Cargar un valor" })
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Sólo un administrador/)).toBeInTheDocument()
  })
})
