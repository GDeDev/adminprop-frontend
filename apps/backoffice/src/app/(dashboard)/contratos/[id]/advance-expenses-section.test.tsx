import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  AdvanceExpense,
  AdvanceExpenseList,
} from "@adminprop/shared-types"

import { AdvanceExpensesSection } from "./advance-expenses-section"

let role = "EMPLOYEE"
let list: AdvanceExpenseList
const listHook = vi.fn()
const createExpense = vi.fn()
const updateExpense = vi.fn()
const deleteExpense = vi.fn()

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } }),
}))
vi.mock("@/lib/services-api", () => ({
  useAdvanceExpenses: (contractId: string, settled?: boolean) => {
    listHook(contractId, settled)
    return { isPending: false, isError: false, data: list }
  },
  useCreateAdvanceExpense: () => ({
    mutateAsync: createExpense,
    isPending: false,
  }),
  useUpdateAdvanceExpense: () => ({
    mutateAsync: updateExpense,
    isPending: false,
  }),
  useDeleteAdvanceExpense: () => ({
    mutateAsync: deleteExpense,
    isPending: false,
  }),
}))

function makeExpense(overrides: Partial<AdvanceExpense> = {}): AdvanceExpense {
  return {
    id: "e1",
    contractId: "c1",
    renterId: "r1",
    amount: "15000.00",
    currency: "ARS",
    description: "Arreglo de la canilla",
    expenseDate: "2026-10-05",
    receiptUrl: "https://files.example/canilla.jpg",
    settled: false,
    settlementId: null,
    settledAt: null,
    registeredBy: { id: "u1", fullName: "Ana Pérez" },
    createdAt: "2026-10-05T12:00:00.000Z",
    ...overrides,
  }
}

const contract = { id: "c1", currency: "ARS" as const }

afterEach(() => {
  role = "EMPLOYEE"
  vi.clearAllMocks()
})

describe("AdvanceExpensesSection", () => {
  it("muestra cada gasto con su comprobante, el estado y los totales del contrato", () => {
    list = {
      items: [
        makeExpense(),
        makeExpense({
          id: "e2",
          amount: "8000.00",
          description: "Cerrajero",
          settled: true,
          settlementId: "liq-7",
          settledAt: "2026-10-31T00:00:00.000Z",
        }),
      ],
      pendingTotal: "15000.00",
      settledTotal: "8000.00",
    }
    render(<AdvanceExpensesSection contract={contract} />)

    const table = screen.getByRole("table")
    const rows = within(table).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByText("05/10/2026")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("$ 15.000,00")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("Cargó Ana Pérez")).toBeInTheDocument()
    expect(
      within(rows[0]!).getByText("Pendiente de descuento")
    ).toBeInTheDocument()
    expect(
      within(rows[0]!).getByRole("link", { name: "Ver comprobante" })
    ).toHaveAttribute("href", "https://files.example/canilla.jpg")
    expect(
      within(rows[1]!).getByText("Descontado en liquidación")
    ).toBeInTheDocument()
    expect(within(rows[1]!).getByText("Liquidación liq-7")).toBeInTheDocument()

    const totals = screen.getByLabelText("Totales del contrato")
    expect(within(totals).getByText("$ 15.000,00")).toBeInTheDocument()
    expect(within(totals).getByText("$ 8.000,00")).toBeInTheDocument()
  })

  it("edita sólo los pendientes y eliminar es sólo para admin", () => {
    list = {
      items: [
        makeExpense(),
        makeExpense({ id: "e2", description: "Cerrajero", settled: true }),
      ],
      pendingTotal: "15000.00",
      settledTotal: "8000.00",
    }
    const { unmount } = render(<AdvanceExpensesSection contract={contract} />)
    expect(
      screen.getAllByRole("button", {
        name: "Editar gasto Arreglo de la canilla",
      })
    ).not.toHaveLength(0)
    expect(
      screen.queryByRole("button", { name: "Editar gasto Cerrajero" })
    ).toBeNull()
    expect(screen.queryByRole("button", { name: /Eliminar gasto/ })).toBeNull()
    unmount()

    role = "ADMIN"
    render(<AdvanceExpensesSection contract={contract} />)
    expect(
      screen.getAllByRole("button", {
        name: "Eliminar gasto Arreglo de la canilla",
      })
    ).not.toHaveLength(0)
    expect(
      screen.queryByRole("button", { name: "Eliminar gasto Cerrajero" })
    ).toBeNull()
  })

  it("el filtro pide pendientes o descontados a la API", async () => {
    list = { items: [], pendingTotal: "0.00", settledTotal: "0.00" }
    render(<AdvanceExpensesSection contract={contract} />)
    const user = userEvent.setup()
    expect(listHook).toHaveBeenLastCalledWith("c1", undefined)

    await user.click(screen.getByRole("tab", { name: "Pendientes" }))
    expect(listHook).toHaveBeenLastCalledWith("c1", false)
    expect(screen.getByText("Sin gastos pendientes.")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Descontados" }))
    expect(listHook).toHaveBeenLastCalledWith("c1", true)
  })

  it("registrar exige el comprobante y manda el multipart con el monto normalizado", async () => {
    list = { items: [], pendingTotal: "0.00", settledTotal: "0.00" }
    createExpense.mockResolvedValue(makeExpense())
    render(<AdvanceExpensesSection contract={contract} />)
    // Sin `applyAccept`, user-event dejaría pasar sólo lo que admite el
    // input: acá interesa que el chequeo propio rechace lo que no es foto ni PDF.
    const user = userEvent.setup({ applyAccept: false })

    await user.click(screen.getByRole("button", { name: "Registrar gasto" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText("Monto"), "15.000,00")
    await user.type(
      within(dialog).getByLabelText("Qué se pagó"),
      "Arreglo de la canilla"
    )
    const date = within(dialog).getByLabelText("Fecha del gasto")
    await user.clear(date)
    await user.type(date, "2026-10-05")

    const submit = within(dialog).getByRole("button", {
      name: "Registrar gasto",
    })
    await user.click(submit)
    expect(
      await within(dialog).findByText("Adjuntá el comprobante.")
    ).toBeInTheDocument()
    expect(createExpense).not.toHaveBeenCalled()

    const wrong = new File(["x"], "nota.txt", { type: "text/plain" })
    await user.upload(within(dialog).getByLabelText("Comprobante"), wrong)
    expect(
      within(dialog).getByText(/tiene que ser una foto/)
    ).toBeInTheDocument()

    const receipt = new File(["x"], "canilla.jpg", { type: "image/jpeg" })
    await user.upload(within(dialog).getByLabelText("Comprobante"), receipt)
    await user.click(submit)

    expect(createExpense).toHaveBeenCalledWith({
      contractId: "c1",
      amount: "15000.00",
      description: "Arreglo de la canilla",
      expenseDate: "2026-10-05",
      currency: "ARS",
      file: receipt,
    })
  })
})
