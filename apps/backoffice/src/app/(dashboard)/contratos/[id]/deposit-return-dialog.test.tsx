import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  ContractAccountDeposit,
  DepositReturn,
} from "@adminprop/shared-types"

import { DepositReturnDialog } from "./deposit-return-dialog"

const register = vi.fn()

vi.mock("@/lib/settlements-api", () => ({
  useRegisterDepositReturn: () => ({ mutateAsync: register, isPending: false }),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function deposit(
  patch: Partial<ContractAccountDeposit> = {}
): ContractAccountDeposit {
  return {
    amount: "200000.00",
    currency: "ARS",
    returnMode: "FIXED",
    suggestedReturn: "200000.00",
    returned: null,
    ...patch,
  }
}

function apiError(code: string) {
  return Object.assign(new Error(code), {
    isAxiosError: true,
    response: { status: 400, data: { code, message: "mensaje técnico" } },
  })
}

function renderDialog(d: ContractAccountDeposit) {
  render(
    <DepositReturnDialog
      contractId="c1"
      deposit={d}
      installments={[]}
      open
      onOpenChange={vi.fn()}
    />
  )
  return screen.getByRole("dialog")
}

const saved: DepositReturn = {
  id: "r1",
  contractId: "c1",
  returnedAt: "2026-11-04",
  depositAmount: "200000.00",
  depositCurrency: "ARS",
  mode: "FOLLOWS_RENT",
  referenceAmount: "260000.00",
  returnedAmount: "230000.00",
  method: "TRANSFER",
  notes: null,
  registeredBy: null,
  deductions: [
    {
      id: "d1",
      concept: "DAMAGE",
      description: "Puerta rota",
      amount: "30000.00",
      installmentId: null,
      paymentId: null,
    },
  ],
  createdAt: "2026-11-04T10:00:00.000Z",
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("DepositReturnDialog", () => {
  it("modo fijo: muestra la referencia de la API y no pide ni manda monto", async () => {
    register.mockResolvedValue({ ...saved, mode: "FIXED" })
    const user = userEvent.setup()
    const dialog = renderDialog(deposit())
    expect(within(dialog).getByText(/Modo del contrato/)).toHaveTextContent(
      "Se devuelve lo recibido"
    )
    expect(
      within(dialog).queryByLabelText(/Monto de referencia/)
    ).not.toBeInTheDocument()
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar devolución" })
    )
    const body = register.mock.calls[0]![0] as Record<string, unknown>
    expect(body.referenceAmount).toBeUndefined()
    expect(body).not.toHaveProperty("returnedAmount", expect.anything())
  })

  it("sigue al alquiler: muestra el alquiler vigente que informa la API", () => {
    const dialog = renderDialog(
      deposit({ returnMode: "FOLLOWS_RENT", suggestedReturn: "260000.00" })
    )
    expect(within(dialog).getByText(/alquiler vigente al cerrar/)).toBeVisible()
    expect(within(dialog).getByText(/260\.000/)).toBeVisible()
  })

  it("manual: exige el monto de referencia y lo manda como string", async () => {
    register.mockResolvedValue({ ...saved, mode: "MANUAL" })
    const user = userEvent.setup()
    const dialog = renderDialog(
      deposit({ returnMode: "MANUAL", suggestedReturn: null })
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar devolución" })
    )
    expect(
      within(dialog).getByText("Indicá el monto de referencia, mayor que cero.")
    ).toBeVisible()
    expect(register).not.toHaveBeenCalled()

    await user.type(
      within(dialog).getByLabelText(/Monto de referencia/),
      "260000"
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar devolución" })
    )
    expect(register.mock.calls[0]![0]).toMatchObject({
      referenceAmount: "260000",
    })
  })

  it("una deducción sin motivo no se envía", async () => {
    const user = userEvent.setup()
    const dialog = renderDialog(deposit())
    await user.click(within(dialog).getByRole("button", { name: "Agregar" }))
    await user.type(within(dialog).getByLabelText("Monto"), "5000")
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar devolución" })
    )
    expect(within(dialog).getByText(/necesita un motivo/)).toBeVisible()
    expect(register).not.toHaveBeenCalled()
  })

  it("tras registrar muestra lo que devolvió la API, sin calcular", async () => {
    register.mockResolvedValue(saved)
    const user = userEvent.setup()
    const dialog = renderDialog(deposit({ returnMode: "FOLLOWS_RENT" }))
    await user.click(within(dialog).getByRole("button", { name: "Agregar" }))
    await user.type(within(dialog).getByLabelText("Monto"), "30000")
    await user.type(
      within(dialog).getByLabelText("Motivo (obligatorio)"),
      "Puerta rota"
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar devolución" })
    )
    expect(register.mock.calls[0]![0]).toMatchObject({
      deductions: [
        { concept: "DAMAGE", description: "Puerta rota", amount: "30000" },
      ],
    })
    const done = await screen.findByRole("dialog")
    expect(within(done).getByText("Depósito devuelto")).toBeVisible()
    expect(within(done).getByText(/230\.000/)).toBeVisible()
    expect(within(done).getByText(/260\.000/)).toBeVisible()
    expect(within(done).getByText(/Puerta rota/)).toBeVisible()
  })

  it.each([
    ["DEPOSIT_RETURN_DEDUCTIONS_EXCEED", /deducciones superan/],
    ["DEPOSIT_RETURN_INVALID_REFERENCE", /ya no coincide/],
  ])("traduce %s a un mensaje claro", async (code, text) => {
    register.mockRejectedValue(apiError(code))
    const user = userEvent.setup()
    const dialog = renderDialog(deposit())
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar devolución" })
    )
    expect(await within(dialog).findByText(text)).toBeVisible()
  })
})
