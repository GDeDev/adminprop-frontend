import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { ContractDetail } from "@adminprop/shared-types"

import { ContractForm } from "./contract-form"

const push = vi.fn()
const create = vi.fn()
const renew = vi.fn()
const upload = vi.fn()
let propertyOwner: { id: string; fullName: string } | null = {
  id: "o1",
  fullName: "María Fernández",
}

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@/lib/contracts-api", () => ({
  useCreateContract: () => ({ mutateAsync: create }),
  useRenewContract: () => ({ mutateAsync: renew }),
  useUploadContractDocument: () => ({ mutateAsync: upload }),
}))
vi.mock("@/lib/properties-api", () => ({
  useProperty: (id: string, enabled = true) => ({
    data:
      enabled && id
        ? { id, address: "Calle 7 1234", owner: propertyOwner }
        : undefined,
  }),
}))
vi.mock("@/lib/renters-api", () => ({
  useRenter: (id: string) => ({
    data: id
      ? {
          id,
          fullName: "Lucía Gómez",
          guarantor: { id: "g1", fullName: "Ricardo Sosa" },
        }
      : undefined,
  }),
}))

// Los selectores buscan contra la API: acá, inputs simples.
function mockSelect(name: string) {
  function MockSelect(props: {
    id?: string
    value: string | null
    onChange: (id: string | null, label: string | null) => void
  }) {
    return (
      <input
        id={props.id}
        aria-label={props.id ?? name}
        value={props.value ?? ""}
        onChange={(event) =>
          props.onChange(event.target.value || null, event.target.value || null)
        }
      />
    )
  }
  return MockSelect
}
vi.mock("@/components/property-select", () => ({
  PropertySelect: mockSelect("property"),
}))
vi.mock("@/components/renter-select", () => ({
  RenterSelect: mockSelect("renter"),
}))
vi.mock("@/components/guarantor-select", () => ({
  GuarantorSelect: mockSelect("guarantor"),
}))

const DRAFT_KEY = "adminprop:contract-draft"

beforeEach(() => {
  window.localStorage.clear()
  propertyOwner = { id: "o1", fullName: "María Fernández" }
  create.mockResolvedValue({ id: "c1" })
  renew.mockResolvedValue({ id: "c2" })
  upload.mockResolvedValue({ id: "c1" })
})

afterEach(() => {
  vi.clearAllMocks()
})

function nextButton() {
  return screen.getByRole("button", { name: "Siguiente" })
}

describe("ContractForm (alta)", () => {
  it("no avanza sin propiedad y muestra el propietario al elegir una", async () => {
    render(<ContractForm />)
    const user = userEvent.setup()

    await user.click(nextButton())
    expect(await screen.findByText("Elegí la propiedad.")).toBeInTheDocument()

    await user.type(screen.getByLabelText("contract-property"), "p1")
    expect(await screen.findByText("María Fernández")).toBeInTheDocument()
  })

  it("una propiedad sin propietario no deja seguir", async () => {
    propertyOwner = null
    render(<ContractForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText("contract-property"), "p1")
    expect(
      await screen.findByText(/no tiene propietario y sin propietario/)
    ).toBeInTheDocument()
    await user.click(nextButton())
    expect(
      await screen.findByText(
        "La propiedad no tiene propietario. Asignale uno primero."
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/1\. Propiedad/)).toHaveAttribute(
      "aria-current",
      "step"
    )
  })

  it("recorre los 5 pasos, exige el email con caución, crea el contrato y sube el PDF", async () => {
    render(<ContractForm />)
    const user = userEvent.setup()

    // 1. Propiedad
    await user.type(screen.getByLabelText("contract-property"), "p1")
    await user.click(nextButton())

    // 2. Inquilino → el garante se precarga
    await user.type(screen.getByLabelText("contract-renter"), "r1")
    await waitFor(() =>
      expect(screen.getByLabelText("contract-guarantor")).toHaveValue("g1")
    )
    await user.click(nextButton())

    // 3. Condiciones: el monto se muestra formateado y el depósito es obligatorio
    await user.type(screen.getByLabelText("Alquiler inicial"), "480.000,50")
    expect(await screen.findByText("$ 480.000,50")).toBeInTheDocument()
    await user.click(nextButton())
    expect(
      await screen.findByText("Ingresá el depósito (puede ser 0).")
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText("Depósito en garantía"), "480000")
    await user.click(nextButton())

    // 4. Caución: con el interruptor prendido, el email es obligatorio
    await user.click(screen.getByLabelText("Tiene seguro de caución"))
    await user.type(screen.getByLabelText("Aseguradora"), "Finaer")
    await user.click(nextButton())
    expect(
      await screen.findByText("Con caución, el email de alerta es obligatorio.")
    ).toBeInTheDocument()
    await user.type(
      screen.getByLabelText("Email de alerta de la aseguradora"),
      "alertas@finaer.example"
    )
    await user.click(nextButton())

    // 5. Fechas y documento
    fireEvent.change(screen.getByLabelText("Inicio"), {
      target: { value: "2026-03-01" },
    })
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "2026-02-01" },
    })
    const pdf = new File(["%PDF"], "contrato.pdf", { type: "application/pdf" })
    await user.upload(screen.getByLabelText(/Adjuntar el contrato/), pdf)
    await user.click(screen.getByRole("button", { name: "Crear contrato" }))
    expect(
      await screen.findByText(
        "La fecha de fin tiene que ser posterior a la de inicio."
      )
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "2028-02-29" },
    })
    await user.click(screen.getByRole("button", { name: "Crear contrato" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/contratos/c1"))
    expect(create).toHaveBeenCalledWith({
      propertyId: "p1",
      renterId: "r1",
      guarantorId: "g1",
      startDate: "2026-03-01",
      endDate: "2028-02-29",
      initialRent: "480000.50",
      currency: "ARS",
      rentUpdateType: "ICL",
      rentUpdateFrequency: "QUARTERLY",
      fixedIncreasePercentage: null,
      deposit: "480000",
      depositCurrency: "ARS",
      depositReturnMode: "FIXED",
      collectionMode: "AGENCY",
      feeMode: "DEDUCTED",
      feeAmount: null,
      lateFeePercentage: null,
      lateFeeGraceDays: null,
      hasSurety: true,
      insurerName: "Finaer",
      insurerAlertEmail: "alertas@finaer.example",
      policyNumber: null,
      policyExpiresAt: null,
      notes: null,
    })
    expect(upload).toHaveBeenCalledWith({
      id: "c1",
      kind: "contract",
      file: pdf,
    })
    // El borrador se descarta al guardar.
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it("guarda un borrador y lo recupera al volver", async () => {
    const { unmount } = render(<ContractForm />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText("contract-property"), "p9")
    unmount()

    render(<ContractForm />)

    expect(screen.getByLabelText("contract-property")).toHaveValue("p9")
    expect(
      screen.getByText("Recuperamos lo que habías cargado.")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Empezar de cero" }))
    expect(screen.getByLabelText("contract-property")).toHaveValue("")
  })
})

describe("ContractForm (renovación)", () => {
  const original = {
    id: "c1",
    property: { id: "p1", address: "Calle 7 1234" },
    owner: { id: "o1", fullName: "María Fernández" },
    renter: { id: "r1", fullName: "Lucía Gómez" },
    guarantor: { id: "g1", fullName: "Ricardo Sosa" },
    startDate: "2023-03-01",
    endDate: "2026-02-28",
    currency: "ARS",
    initialRent: "300000.00",
    currentRent: "552000.00",
    deposit: "300000.00",
    rentUpdateType: "IPC",
    rentUpdateFrequency: "FOUR_MONTHLY",
    fixedIncreasePercentage: null,
    depositCurrency: "ARS",
    depositReturnMode: "FOLLOWS_RENT",
    billingTerms: {
      id: "t1",
      effectiveFrom: "2023-03-01",
      collectionMode: "OWNER_DIRECT",
      feeMode: "OWNER_PAYS",
      feePercentage: "5.00",
      feeAmount: null,
      lateFeePercentage: "3.00",
      lateFeeGraceDays: 5,
      inheritedLateFeePercentage: false,
      inheritedLateFeeGraceDays: false,
      notes: null,
      changedBy: null,
      createdAt: "2023-03-01T00:00:00.000Z",
    },
    billingTermsHistory: [],
    status: "ACTIVE",
    hasSurety: false,
    surety: null,
    notes: "Renovar con el mismo garante.",
  } as unknown as ContractDetail

  it("precarga el original, fija la propiedad y llama a renovar", async () => {
    render(<ContractForm original={original} />)
    const user = userEvent.setup()

    expect(screen.getByText("Renovar contrato")).toBeInTheDocument()
    expect(screen.queryByLabelText("contract-property")).not.toBeInTheDocument()
    expect(screen.getByText("Calle 7 1234")).toBeInTheDocument()
    await user.click(nextButton())
    expect(screen.getByLabelText("contract-renter")).toHaveValue("r1")
    expect(screen.getByLabelText("contract-guarantor")).toHaveValue("g1")
    await user.click(nextButton())
    expect(screen.getByLabelText("Alquiler inicial")).toHaveValue("552000.00")
    await user.click(nextButton())
    await user.click(nextButton())
    expect(screen.getByLabelText("Inicio")).toHaveValue("2026-03-01")
    fireEvent.change(screen.getByLabelText("Fin"), {
      target: { value: "2029-02-28" },
    })
    await user.click(screen.getByRole("button", { name: "Renovar contrato" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/contratos/c2"))
    expect(renew).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "c1",
        renterId: "r1",
        guarantorId: "g1",
        initialRent: "552000.00",
        rentUpdateType: "IPC",
        rentUpdateFrequency: "FOUR_MONTHLY",
        startDate: "2026-03-01",
        endDate: "2029-02-28",
        notes: "Renovar con el mismo garante.",
        // Los términos de cobro del original se proponen para el nuevo.
        depositReturnMode: "FOLLOWS_RENT",
        collectionMode: "OWNER_DIRECT",
        feeMode: "OWNER_PAYS",
        lateFeePercentage: "3.00",
        lateFeeGraceDays: 5,
      })
    )
    expect(renew.mock.calls[0]![0]).not.toHaveProperty("propertyId")
  })
})
