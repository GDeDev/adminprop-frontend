import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type {
  ArrearsReport,
  IncomeReport,
  PropertiesReport,
} from "@adminprop/shared-types"

import { currentPeriod, shiftPeriod } from "@/lib/billing"
import { ReportsScreen } from "./reports-screen"

let current: "ADMIN" | "EMPLOYEE" = "ADMIN"
const download = vi.fn()
const incomeQuery = vi.fn()
const paymentsQuery = vi.fn()
const arrearsQuery = vi.fn()
const propertiesQuery = vi.fn()
const expiringQuery = vi.fn()
const servicesQuery = vi.fn()

vi.mock("@adminprop/session/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@adminprop/session/client")>()
  return {
    ...actual,
    useSession: () => ({ user: { id: "u1", role: current } }),
  }
})

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock("@/lib/reports-api", () => ({
  downloadExport: (...args: unknown[]) => download(...args),
  useIncomeReport: (...args: unknown[]) => incomeQuery(...args),
  usePaymentsReport: (...args: unknown[]) => paymentsQuery(...args),
  useArrearsReport: (...args: unknown[]) => arrearsQuery(...args),
  usePropertiesReport: (...args: unknown[]) => propertiesQuery(...args),
  useExpiringContractsReport: (...args: unknown[]) => expiringQuery(...args),
  useServicesReport: (...args: unknown[]) => servicesQuery(...args),
}))

const zeroBreakdown = {
  rent: "0.00",
  lateFees: "0.00",
  charges: "0.00",
  total: "0.00",
}
const byReceiver = {
  agency: {
    rent: "100000.00",
    lateFees: "0.00",
    charges: "0.00",
    total: "100000.00",
  },
  owner: zeroBreakdown,
}

function income(rows: IncomeReport["rows"]): IncomeReport {
  return {
    generatedAt: "2026-11-06T10:00:00Z",
    filters: {},
    rows,
    totals: rows.length
      ? [
          {
            currency: "ARS",
            collected: {
              rent: "100000.00",
              lateFees: "0.00",
              charges: "0.00",
              total: "100000.00",
            },
            collectedByReceiver: byReceiver,
          },
        ]
      : [],
  }
}

const incomeRow: IncomeReport["rows"][number] = {
  period: "2026-10",
  currency: "ARS",
  rentCollected: "100000.00",
  lateFeesCollected: "0.00",
  chargesCollected: "0.00",
  collectedByReceiver: byReceiver,
  feesAccrued: "5000.00",
  feesCollected: "5000.00",
  netSettled: "95000.00",
  netTransferred: "95000.00",
}

const arrears: ArrearsReport = {
  generatedAt: "2026-11-06T10:00:00Z",
  filters: {},
  rows: [],
  totals: [],
}

const properties: PropertiesReport = {
  generatedAt: "2026-11-06T10:00:00Z",
  filters: {},
  rows: [],
}

function ok<T>(data: T) {
  return { isPending: false, isError: false, data, refetch: vi.fn() }
}

beforeEach(() => {
  incomeQuery.mockReturnValue(ok(income([incomeRow])))
  paymentsQuery.mockReturnValue(
    ok({ data: [], pagination: { page: 1, limit: 100, total: 0 } })
  )
  arrearsQuery.mockReturnValue(ok(arrears))
  propertiesQuery.mockReturnValue(ok(properties))
  expiringQuery.mockReturnValue(ok({ ...arrears, rows: [] }))
  servicesQuery.mockReturnValue(ok({ ...arrears, rows: [] }))
  download.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.clearAllMocks()
})

async function openReportSelect(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: "Reporte" }))
  return screen.findByRole("listbox")
}

describe("ReportsScreen", () => {
  it("ofrece los 7 reportes agrupados en Financieros y Operativos, sin propietario ni inquilino", async () => {
    const user = userEvent.setup()
    render(<ReportsScreen />)
    const listbox = await openReportSelect(user)
    const options = within(listbox).getAllByRole("option")
    expect(options.map((option) => option.textContent)).toEqual([
      "Financieros: Ingresos y honorarios",
      "Financieros: Alquileres pagados",
      "Financieros: Alquileres vencidos",
      "Operativos: Propiedades alquiladas",
      "Operativos: Propiedades disponibles",
      "Operativos: Contratos por vencer",
      "Operativos: Servicios vencidos",
    ])
    // A-93: no hay reportes por propietario ni por inquilino.
    expect(within(listbox).queryByText(/^(Propietario|Inquilino)/)).toBeNull()
    expect(
      within(listbox).queryByText(/por propietario|por inquilino/i)
    ).toBeNull()
  })

  it("cambiar desde/hasta consulta el reporte con ese rango", async () => {
    const user = userEvent.setup()
    render(<ReportsScreen />)
    const initial = {
      from: shiftPeriod(currentPeriod(), -5),
      to: currentPeriod(),
    }
    expect(incomeQuery).toHaveBeenLastCalledWith(initial)

    await user.click(screen.getByRole("combobox", { name: "Desde: mes" }))
    await user.click(await screen.findByRole("option", { name: "Enero" }))
    await waitFor(() =>
      expect(incomeQuery).toHaveBeenLastCalledWith({
        from: `${initial.from.slice(0, 4)}-01`,
        to: initial.to,
      })
    )

    await user.click(screen.getByRole("combobox", { name: "Hasta: mes" }))
    await user.click(await screen.findByRole("option", { name: "Diciembre" }))
    await waitFor(() =>
      expect(incomeQuery).toHaveBeenLastCalledWith({
        from: `${initial.from.slice(0, 4)}-01`,
        to: `${initial.to.slice(0, 4)}-12`,
      })
    )
  })

  it("no valida el rango: con hasta anterior a desde igual consulta y exporta, sin mensaje de error", async () => {
    // Documenta el comportamiento actual: el componente no valida hasta < desde
    // ni el máximo de 36 meses; eso queda en manos de la API.
    const user = userEvent.setup()
    const { container } = render(<ReportsScreen />)
    const year = Number(currentPeriod().slice(0, 4)) - 6

    await user.click(screen.getByRole("combobox", { name: "Hasta: año" }))
    await user.click(await screen.findByRole("option", { name: String(year) }))

    await waitFor(() =>
      expect(incomeQuery).toHaveBeenLastCalledWith({
        from: shiftPeriod(currentPeriod(), -5),
        to: `${year}${currentPeriod().slice(4)}`,
      })
    )
    expect(screen.queryByRole("alert")).toBeNull()
    expect(container.textContent).not.toMatch(/inválido|no puede ser|36 meses/i)

    await user.click(screen.getByRole("button", { name: /Excel/ }))
    expect(download).toHaveBeenCalledWith(
      "/reports/financial/income",
      {
        from: shiftPeriod(currentPeriod(), -5),
        to: `${year}${currentPeriod().slice(4)}`,
      },
      "xlsx",
      "reporte-income"
    )
  })

  it("sin datos muestra el estado vacío y nunca NaN ni undefined", async () => {
    incomeQuery.mockReturnValue(ok(income([])))
    const { container } = render(<ReportsScreen />)
    expect(await screen.findByText("Sin resultados")).toBeInTheDocument()
    expect(
      screen.getByText("No hay datos para esos filtros.")
    ).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/NaN|undefined/)
  })

  it("con datos tampoco muestra NaN ni undefined", () => {
    const { container } = render(<ReportsScreen />)
    expect(screen.getAllByText(/100\.000,00/).length).toBeGreaterThan(0)
    expect(container.textContent).not.toMatch(/NaN|undefined/)
  })

  it("un error de la query muestra el estado de error con reintentar", async () => {
    const refetch = vi.fn()
    incomeQuery.mockReturnValue({ isPending: false, isError: true, refetch })
    const user = userEvent.setup()
    render(<ReportsScreen />)
    expect(
      await screen.findByText("No se pudo cargar el reporte")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Reintentar/i }))
    expect(refetch).toHaveBeenCalled()
  })

  it("exporta a Excel y PDF con el mismo reporte y filtros (no ofrece CSV)", async () => {
    const user = userEvent.setup()
    render(<ReportsScreen />)
    const range = {
      from: shiftPeriod(currentPeriod(), -5),
      to: currentPeriod(),
    }

    await user.click(screen.getByRole("button", { name: /Excel/ }))
    expect(download).toHaveBeenLastCalledWith(
      "/reports/financial/income",
      range,
      "xlsx",
      "reporte-income"
    )
    await user.click(screen.getByRole("button", { name: /PDF/ }))
    expect(download).toHaveBeenLastCalledWith(
      "/reports/financial/income",
      range,
      "pdf",
      "reporte-income"
    )
    expect(screen.queryByRole("button", { name: /CSV/i })).toBeNull()
  })

  it("al cambiar de reporte la exportación usa su URL y sus filtros", async () => {
    const user = userEvent.setup()
    render(<ReportsScreen />)
    await openReportSelect(user)
    await user.click(
      await screen.findByRole("option", {
        name: "Financieros: Alquileres vencidos",
      })
    )

    const minDays = await screen.findByLabelText("Días de atraso mínimos")
    await user.clear(minDays)
    await user.type(minDays, "15")
    await waitFor(() => expect(arrearsQuery).toHaveBeenLastCalledWith(15))

    await user.click(screen.getByRole("button", { name: /PDF/ }))
    expect(download).toHaveBeenLastCalledWith(
      "/reports/financial/arrears",
      { minDays: 15 },
      "pdf",
      "reporte-arrears"
    )
  })

  it("un fallo de la descarga avisa con un toast de error", async () => {
    const { toast } = await import("sonner")
    download.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<ReportsScreen />)
    await user.click(screen.getByRole("button", { name: /Excel/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it.each(["ADMIN", "EMPLOYEE"] as const)(
    "la pantalla no depende del rol: %s ve el título y el selector",
    (role) => {
      // El componente no usa useSession ni tiene nada solo-admin; el acceso
      // por rol lo resuelve la navegación/layout, no la pantalla.
      current = role
      render(<ReportsScreen />)
      expect(
        screen.getByRole("heading", { name: "Reportes" })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("combobox", { name: "Reporte" })
      ).toBeInTheDocument()
    }
  )
})
