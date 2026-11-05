import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { TenantSettings, User } from "@adminprop/shared-types"

import { BillingParametersScreen } from "./billing-parameters-screen"

let role: User["role"] = "ADMIN"
let settings: Partial<TenantSettings> = {}
const update = vi.fn()

function baseSettings(): TenantSettings {
  return {
    id: "t1",
    slug: "oppido",
    name: "Oppido",
    receiptSequence: 7,
    logoUrl: null,
    dailyLateFeePercentage: "0.50",
    paymentGraceDays: 10,
    lateFeeStartDay: 11,
    autoApplyCreditOnGeneration: false,
    ...settings,
  } as TenantSettings
}

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } as User }),
}))
vi.mock("@/lib/tenant-settings-api", () => ({
  useTenantSettings: () => ({
    isPending: false,
    isError: false,
    data: baseSettings(),
  }),
  useUpdateTenantSettings: () => ({ mutateAsync: update, isPending: false }),
}))

afterEach(() => {
  role = "ADMIN"
  settings = {}
  vi.clearAllMocks()
})

describe("BillingParametersScreen", () => {
  it("solo los administradores ven la pantalla", () => {
    role = "EMPLOYEE"
    render(<BillingParametersScreen />)
    expect(screen.getByText("Solo para administradores")).toBeInTheDocument()
    expect(screen.queryByLabelText(/Punitorio diario/)).not.toBeInTheDocument()
  })

  it("avisa que ya no hay un 5 % por defecto y muestra los valores vigentes", () => {
    render(<BillingParametersScreen />)
    expect(screen.getByText(/Ya no hay un 5 % por defecto/)).toBeInTheDocument()
    expect(screen.getByText("0,50 %")).toBeInTheDocument()
    expect(screen.getByText("11")).toBeInTheDocument()
  })

  it("manda solo lo que cambió", async () => {
    update.mockResolvedValue(baseSettings())
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    const grace = screen.getByLabelText("Días de gracia por defecto")
    await user.clear(grace)
    await user.type(grace, "5")
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    expect(update).toHaveBeenCalledWith({ paymentGraceDays: 5 })
  })

  it("acepta la coma decimal y manda el string normalizado", async () => {
    update.mockResolvedValue(baseSettings())
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    const pct = screen.getByLabelText("Punitorio diario por defecto (%)")
    await user.clear(pct)
    await user.type(pct, "1,25")
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    expect(update).toHaveBeenCalledWith({ dailyLateFeePercentage: "1.25" })
  })

  it("el interruptor del saldo a favor arranca apagado, se explica y se guarda", async () => {
    update.mockResolvedValue(baseSettings())
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    const toggle = screen.getByRole("switch", {
      name: "Aplicar el saldo a favor al generar la cuota",
    })
    expect(toggle).not.toBeChecked()
    expect(toggle).toHaveAccessibleDescription(/a mano o al registrar un pago/)

    await user.click(toggle)
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    expect(update).toHaveBeenCalledWith({ autoApplyCreditOnGeneration: true })
  })

  it("con el saldo a favor automático encendido, apagarlo manda false", async () => {
    settings = { autoApplyCreditOnGeneration: true }
    update.mockResolvedValue(baseSettings())
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("switch"))
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    expect(update).toHaveBeenCalledWith({ autoApplyCreditOnGeneration: false })
  })

  it("no deja quitar el porcentaje una vez fijado", async () => {
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    await user.clear(screen.getByLabelText("Punitorio diario por defecto (%)"))
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    expect(
      await screen.findByText(/no se puede quitar. Si no querés cobrar/)
    ).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })

  it("sin porcentaje fijado puede guardar solo los días de gracia", async () => {
    settings = { dailyLateFeePercentage: null }
    update.mockResolvedValue(baseSettings())
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    expect(screen.getByText("Sin definir")).toBeInTheDocument()
    const grace = screen.getByLabelText("Días de gracia por defecto")
    await user.clear(grace)
    await user.type(grace, "3")
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    expect(update).toHaveBeenCalledWith({ paymentGraceDays: 3 })
  })

  it("valida rangos antes de llamar a la API", async () => {
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    const pct = screen.getByLabelText("Punitorio diario por defecto (%)")
    await user.clear(pct)
    await user.type(pct, "150")
    const grace = screen.getByLabelText("Días de gracia por defecto")
    await user.clear(grace)
    await user.type(grace, "61")
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    expect(screen.getByText(/no puede superar el 100/)).toBeInTheDocument()
    expect(screen.getByText(/no pueden superar 60/)).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })

  it("muestra en español el error que devuelve la API", async () => {
    const { AxiosError } = await import("axios")
    update.mockRejectedValue(
      new AxiosError("x", "400", undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as never,
        data: {
          success: false,
          code: "TENANT_INVALID_BILLING_SETTING",
          message: "dailyLateFeePercentage: no puede quedar vacío",
        },
      })
    )
    render(<BillingParametersScreen />)
    const user = userEvent.setup()

    const grace = screen.getByLabelText("Días de gracia por defecto")
    await user.clear(grace)
    await user.type(grace, "2")
    await user.click(screen.getByRole("button", { name: "Guardar" }))

    expect(
      await screen.findByText(/tiene que estar entre 0 y 100 %/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/dailyLateFeePercentage/)).not.toBeInTheDocument()
  })
})
