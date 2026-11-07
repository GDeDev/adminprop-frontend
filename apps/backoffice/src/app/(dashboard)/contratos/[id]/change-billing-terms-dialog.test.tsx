import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ContractCurrentBillingTerms } from "@adminprop/shared-types"

import { ChangeBillingTermsDialog } from "./change-billing-terms-dialog"

const change = vi.fn()
let reference: { percentage: string | null | undefined; graceDays?: number } = {
  percentage: "0.50",
  graceDays: 10,
}

vi.mock("@/lib/tenant-settings-api", () => ({
  useTenantLateFeeReference: () => reference,
}))

vi.mock("@/lib/contracts-api", () => ({
  useChangeBillingTerms: () => ({ mutateAsync: change, isPending: false }),
}))

const terms: ContractCurrentBillingTerms = {
  id: "t1",
  effectiveFrom: "2026-01-01",
  collectionMode: "AGENCY",
  feeMode: "DEDUCTED",
  feePercentage: "5.00",
  feeAmount: null,
  lateFeePercentage: "5.00",
  lateFeeGraceDays: 10,
  lateFeeStartDay: 11,
  inheritedLateFeePercentage: true,
  inheritedLateFeeGraceDays: true,
  notes: null,
  changedBy: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const contract = {
  id: "c1",
  currency: "ARS" as const,
  startDate: "2026-01-01",
  endDate: "2027-12-31",
}

afterEach(() => {
  vi.clearAllMocks()
  reference = { percentage: "0.50", graceDays: 10 }
})

describe("ChangeBillingTermsDialog", () => {
  it("precarga los términos vigentes y manda solo lo que cambia con la fecha", async () => {
    change.mockResolvedValue({})
    const user = userEvent.setup()
    render(
      <ChangeBillingTermsDialog
        contract={contract}
        terms={terms}
        open
        onOpenChange={vi.fn()}
      />
    )
    const dialog = screen.getByRole("dialog")

    await user.click(
      within(dialog).getByRole("combobox", { name: "Quién cobra" })
    )
    await user.click(
      screen.getByRole("option", { name: "Cobra el propietario" })
    )
    await user.click(
      within(dialog).getByRole("combobox", { name: "Honorarios" })
    )
    await user.click(
      screen.getByRole("option", { name: "Los paga el propietario después" })
    )
    await user.click(within(dialog).getByLabelText(/Punitorio propio/))
    await user.clear(within(dialog).getByLabelText("Punitorio diario (%)"))
    await user.type(within(dialog).getByLabelText("Punitorio diario (%)"), "3")
    await user.type(
      within(dialog).getByLabelText("Motivo"),
      "Pedido del propietario"
    )
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }))

    expect(change).toHaveBeenCalledTimes(1)
    expect(change.mock.calls[0]![0]).toMatchObject({
      id: "c1",
      collectionMode: "OWNER_DIRECT",
      feeMode: "OWNER_PAYS",
      feePercentage: "5.00",
      feeAmount: null,
      lateFeePercentage: "3",
      lateFeeGraceDays: 10,
      notes: "Pedido del propietario",
    })
  })

  it("con importe fijo exige el monto y manda el % como no definido", async () => {
    change.mockResolvedValue({})
    const user = userEvent.setup()
    render(
      <ChangeBillingTermsDialog
        contract={contract}
        terms={terms}
        open
        onOpenChange={vi.fn()}
      />
    )
    const dialog = screen.getByRole("dialog")

    await user.click(
      within(dialog).getByRole("combobox", { name: "Cómo se calculan" })
    )
    await user.click(screen.getByRole("option", { name: "Importe fijo" }))
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }))
    expect(change).not.toHaveBeenCalled()
    expect(
      within(dialog).getByText("Ingresá el importe fijo.")
    ).toBeInTheDocument()

    await user.type(
      within(dialog).getByLabelText(/Importe fijo por mes/),
      "15000"
    )
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }))
    expect(change.mock.calls[0]![0]).toMatchObject({
      feeAmount: "15000",
      feePercentage: undefined,
      lateFeePercentage: null,
      lateFeeGraceDays: null,
    })
  })

  function renderDialog() {
    render(
      <ChangeBillingTermsDialog
        contract={contract}
        terms={terms}
        open
        onOpenChange={vi.fn()}
      />
    )
    return screen.getByRole("dialog")
  }

  it("muestra el punitorio de la inmobiliaria como referencia", () => {
    const dialog = renderDialog()
    expect(
      within(dialog).getByText(/Referencia de la inmobiliaria: 0,50 %/)
    ).toBeInTheDocument()
  })

  it("con 'día de inicio' manda lateFeeStartDay y no los días de gracia", async () => {
    change.mockResolvedValue({})
    const user = userEvent.setup()
    const dialog = renderDialog()

    await user.click(within(dialog).getByLabelText(/Punitorio propio/))
    await user.click(
      within(dialog).getByRole("combobox", { name: "Desde cuándo corre" })
    )
    await user.click(
      screen.getByRole("option", { name: "Día de inicio del punitorio" })
    )
    // Ya no se ofrece el campo de gracia: no se pueden mandar los dos.
    expect(within(dialog).queryByLabelText("Días de gracia")).toBeNull()
    await user.clear(within(dialog).getByLabelText("Punitorio diario (%)"))
    await user.type(
      within(dialog).getByLabelText("Punitorio diario (%)"),
      "0,5"
    )
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }))
    expect(
      within(dialog).getByText(
        "Ingresá el día del mes en que empieza, de 1 a 31."
      )
    ).toBeInTheDocument()
    expect(change).not.toHaveBeenCalled()

    await user.type(
      within(dialog).getByLabelText("Día de inicio del punitorio"),
      "16"
    )
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }))
    const body = change.mock.calls[0]![0] as Record<string, unknown>
    expect(body).toMatchObject({
      lateFeePercentage: "0.5",
      lateFeeStartDay: 16,
    })
    expect("lateFeeGraceDays" in body).toBe(false)
  })

  it("sin punitorio en la inmobiliaria obliga a indicar el del contrato", async () => {
    reference = { percentage: null }
    const dialog = renderDialog()
    expect(within(dialog).getByLabelText(/Punitorio propio/)).toBeDisabled()
    expect(
      within(dialog).getByText(/todavía no definió un punitorio diario/)
    ).toBeInTheDocument()
    expect(
      within(dialog).getByLabelText("Punitorio diario (%)")
    ).toBeInTheDocument()
  })

  it("traduce CONTRACT_LATE_FEE_PERCENTAGE_REQUIRED a un mensaje claro en el campo", async () => {
    const user = userEvent.setup()
    change.mockRejectedValue(
      Object.assign(new Error("x"), {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            code: "CONTRACT_LATE_FEE_PERCENTAGE_REQUIRED",
            message: "Indicá el punitorio diario del contrato",
          },
        },
      })
    )
    const dialog = renderDialog()
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }))
    expect(
      await within(dialog).findByText(/La inmobiliaria no tiene un punitorio/)
    ).toBeInTheDocument()
    expect(
      within(dialog).getByLabelText("Punitorio diario (%)")
    ).toBeInTheDocument()
  })
})
