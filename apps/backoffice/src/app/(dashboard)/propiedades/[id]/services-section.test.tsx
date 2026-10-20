import type { UseQueryResult } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ServicesSection, type ServiceRow } from "./services-section"

const createService = vi.fn()
const updateService = vi.fn()
const deleteService = vi.fn()

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@/lib/services-api", () => ({
  useCreateService: () => ({ mutateAsync: createService, isPending: false }),
  useUpdateService: () => ({ mutateAsync: updateService, isPending: false }),
  useDeleteService: () => ({ mutateAsync: deleteService, isPending: false }),
}))
// El selector de maestros tiene sus propios tests: acá, un input simple.
vi.mock("@/components/master-data-select", () => ({
  MasterDataSelect: (props: {
    id?: string
    value: string | null
    onChange: (value: string | null) => void
  }) => (
    <input
      id={props.id}
      aria-label={props.id}
      value={props.value ?? ""}
      onChange={(event) => props.onChange(event.target.value || null)}
    />
  ),
}))

function makeService(overrides: Partial<ServiceRow> = {}): ServiceRow {
  return {
    id: "s1",
    propertyId: "p1",
    contractId: null,
    serviceType: { id: "t-exp", name: "Expensas", isActive: true },
    paidBy: "RENTER",
    currency: "ARS",
    hasDueDate: true,
    dueDate: "2026-10-10",
    hasIncrease: true,
    increaseFrequency: "QUARTERLY",
    managedByAgency: true,
    notes: null,
    status: "OVERDUE",
    daysOverdue: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function loaded(data: ServiceRow[]) {
  return {
    isPending: false,
    isError: false,
    data,
    error: null,
  } as unknown as UseQueryResult<ServiceRow[]>
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("ServicesSection", () => {
  it("muestra cada servicio con quién paga, vencimiento, estado y alcance", () => {
    render(
      <ServicesSection
        propertyId="p1"
        contractId="c1"
        query={loaded([
          makeService({ scope: "PROPERTY" }),
          makeService({
            id: "s2",
            contractId: "c1",
            scope: "CONTRACT",
            serviceType: { id: "t-luz", name: "Luz", isActive: true },
            paidBy: "OWNER",
            hasDueDate: false,
            dueDate: null,
            hasIncrease: false,
            increaseFrequency: null,
            managedByAgency: false,
            status: "UP_TO_DATE",
            daysOverdue: 0,
          }),
        ])}
      />
    )

    const table = screen.getByRole("table")
    const rows = within(table).getAllByRole("row").slice(1)
    expect(rows).toHaveLength(2)

    expect(within(rows[0]!).getByText("Expensas")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("Inquilino · ARS")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("10/10/2026")).toBeInTheDocument()
    expect(
      within(rows[0]!).getByText("Vencido hace 10 días")
    ).toBeInTheDocument()
    expect(within(rows[0]!).getByText("Trimestral")).toBeInTheDocument()
    expect(within(rows[0]!).getByText("De la propiedad")).toBeInTheDocument()
    expect(
      within(rows[0]!).getByText("Gestiona la inmobiliaria")
    ).toBeInTheDocument()

    expect(within(rows[1]!).getByText("Luz")).toBeInTheDocument()
    expect(within(rows[1]!).getByText("Del contrato")).toBeInTheDocument()
    expect(within(rows[1]!).getByText("Sin vencimiento")).toBeInTheDocument()
    expect(within(rows[1]!).getByText("Sin aumentos")).toBeInTheDocument()
    expect(within(rows[1]!).queryByText("Al día")).toBeNull()
  })

  it("sin servicios lo dice, y sin propiedad no deja agregar", () => {
    const { unmount } = render(
      <ServicesSection propertyId="p1" query={loaded([])} />
    )
    expect(screen.getByText(/Sin servicios cargados/)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Agregar servicio" })
    ).toBeInTheDocument()
    unmount()

    render(<ServicesSection propertyId={null} query={loaded([])} />)
    expect(
      screen.queryByRole("button", { name: "Agregar servicio" })
    ).toBeNull()
  })

  it("el alta pide la fecha sólo con vencimiento y la frecuencia sólo con aumentos", async () => {
    createService.mockResolvedValue(makeService())
    render(
      <ServicesSection
        propertyId="p1"
        contractId="c1"
        defaultCurrency="USD"
        query={loaded([])}
      />
    )
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Agregar servicio" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByLabelText("Fecha de vencimiento")).toBeNull()
    expect(within(dialog).queryByLabelText("Frecuencia del aumento")).toBeNull()

    await user.type(within(dialog).getByLabelText("service-type"), "t-exp")
    await user.click(within(dialog).getByLabelText("Tiene vencimiento"))
    await user.click(within(dialog).getByLabelText("Tiene aumentos periódicos"))
    expect(
      within(dialog).getByLabelText("Fecha de vencimiento")
    ).toBeInTheDocument()
    expect(
      within(dialog).getByLabelText("Frecuencia del aumento")
    ).toBeInTheDocument()

    const submit = within(dialog).getByRole("button", {
      name: "Agregar servicio",
    })
    await user.click(submit)
    expect(
      await within(dialog).findByText(
        "Con vencimiento, la fecha es obligatoria."
      )
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText("Con aumentos, la frecuencia es obligatoria.")
    ).toBeInTheDocument()
    expect(createService).not.toHaveBeenCalled()

    await user.type(
      within(dialog).getByLabelText("Fecha de vencimiento"),
      "2026-11-10"
    )
    // La frecuencia se vuelve a apagar: deja de ser obligatoria.
    await user.click(within(dialog).getByLabelText("Tiene aumentos periódicos"))
    await user.click(
      within(dialog).getByLabelText("Lo gestiona la inmobiliaria")
    )
    await user.click(submit)

    expect(createService).toHaveBeenCalledWith({
      propertyId: "p1",
      contractId: "c1",
      serviceTypeId: "t-exp",
      paidBy: "RENTER",
      currency: "USD",
      hasDueDate: true,
      dueDate: "2026-11-10",
      hasIncrease: false,
      increaseFrequency: null,
      managedByAgency: true,
      notes: null,
    })
  })

  it("edita con el formulario precargado y elimina con confirmación", async () => {
    updateService.mockResolvedValue(makeService())
    deleteService.mockResolvedValue(undefined)
    render(<ServicesSection propertyId="p1" query={loaded([makeService()])} />)
    const user = userEvent.setup()

    await user.click(
      screen.getAllByRole("button", { name: "Editar Expensas" })[0]!
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByLabelText("Fecha de vencimiento")).toHaveValue(
      "2026-10-10"
    )
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }))
    expect(updateService).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "s1",
        dueDate: "2026-10-10",
        increaseFrequency: "QUARTERLY",
      })
    )

    await user.click(
      screen.getAllByRole("button", { name: "Eliminar Expensas" })[0]!
    )
    await user.click(await screen.findByRole("button", { name: "Eliminar" }))
    expect(deleteService).toHaveBeenCalledWith("s1")
  })
})
