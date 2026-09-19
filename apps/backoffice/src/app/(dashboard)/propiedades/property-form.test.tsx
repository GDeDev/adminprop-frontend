import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PropertyForm } from "./property-form"

const push = vi.fn()
const create = vi.fn()
const upload = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@/lib/properties-api", () => ({
  useCreateProperty: () => ({ mutateAsync: create }),
  useUpdateProperty: () => ({ mutateAsync: vi.fn() }),
  useUploadPropertyPhotos: () => ({ mutateAsync: upload }),
}))

// Los selectores de maestros tienen sus propios tests: acá, un input simple.
vi.mock("@/components/master-data-select", () => ({
  MasterDataSelect: (props: {
    id?: string
    multiple?: boolean
    value: string | string[] | null
    onChange: (value: unknown) => void
  }) => (
    <input
      id={props.id}
      aria-label={props.id}
      value={
        Array.isArray(props.value) ? props.value.join(",") : (props.value ?? "")
      }
      onChange={(event) =>
        props.onChange(
          props.multiple
            ? event.target.value.split(",").filter(Boolean)
            : event.target.value || null
        )
      }
    />
  ),
}))
vi.mock("@/components/location-cascade-select", () => ({
  LocationCascadeSelect: (props: {
    value: string | null
    onChange: (value: string | null) => void
  }) => (
    <input
      aria-label="Ubicación"
      value={props.value ?? ""}
      onChange={(event) => props.onChange(event.target.value || null)}
    />
  ),
}))

const DRAFT_KEY = "adminprop:property-draft"

beforeEach(() => {
  window.localStorage.clear()
  create.mockResolvedValue({ id: "p1" })
  upload.mockResolvedValue({ id: "p1" })
})

afterEach(() => {
  vi.clearAllMocks()
})

async function fillStepOne(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Dirección"), "Calle 7 1234")
  await user.type(screen.getByLabelText("Ubicación"), "loc-1")
  await user.type(screen.getByLabelText("property-type"), "type-1")
}

describe("PropertyForm (alta)", () => {
  it("no avanza del paso 1 sin los datos obligatorios", async () => {
    render(<PropertyForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Siguiente" }))

    expect(await screen.findByText("Ingresá la dirección.")).toBeInTheDocument()
    expect(screen.getByText("Elegí el tipo de propiedad.")).toBeInTheDocument()
    expect(screen.getByText(/1\. Datos/)).toHaveAttribute(
      "aria-current",
      "step"
    )
  })

  it("recorre los 4 pasos, crea la propiedad, sube las fotos y va a la ficha", async () => {
    render(<PropertyForm />)
    const user = userEvent.setup()

    await fillStepOne(user)
    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(await screen.findByText("Asignar después")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    await user.type(screen.getByLabelText("property-amenities"), "a1")
    await user.click(screen.getByRole("button", { name: "Siguiente" }))

    const photo = new File(["x"], "frente.png", { type: "image/png" })
    await user.upload(screen.getByLabelText(/Agregar fotos/), photo)
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/propiedades/p1"))
    expect(create).toHaveBeenCalledWith({
      address: "Calle 7 1234",
      locationId: "loc-1",
      propertyTypeId: "type-1",
      amenityIds: ["a1"],
      notes: null,
    })
    expect(upload).toHaveBeenCalledWith({ id: "p1", files: [photo] })
    // El borrador se descarta al guardar.
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it("guarda un borrador y lo recupera al volver", async () => {
    const { unmount } = render(<PropertyForm />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText("Dirección"), "Calle 50 800")
    unmount()

    render(<PropertyForm />)

    expect(screen.getByLabelText("Dirección")).toHaveValue("Calle 50 800")
    expect(
      screen.getByText("Recuperamos lo que habías cargado.")
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Empezar de cero" }))
    expect(screen.getByLabelText("Dirección")).toHaveValue("")
  })
})
