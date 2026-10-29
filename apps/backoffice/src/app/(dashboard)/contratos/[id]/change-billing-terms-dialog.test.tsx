import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ContractCurrentBillingTerms } from "@adminprop/shared-types"

import { ChangeBillingTermsDialog } from "./change-billing-terms-dialog"

const change = vi.fn()

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
})

describe("ChangeBillingTermsDialog", () => {
  it("precarga los términos vigentes y manda sólo lo que cambia con la fecha", async () => {
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
    await user.clear(within(dialog).getByLabelText("% diario"))
    await user.type(within(dialog).getByLabelText("% diario"), "3")
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
})
