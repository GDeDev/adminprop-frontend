import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { PropertyDetail } from "@adminprop/shared-types"

import { PropertyForm } from "./property-form"

const push = vi.fn()
const create = vi.fn()
const upload = vi.fn()
const update = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@/lib/properties-api", () => ({
  useCreateProperty: () => ({ mutateAsync: create }),
  useUpdateProperty: () => ({ mutateAsync: update }),
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
// El selector de propietario busca contra la API: acá, un input simple.
vi.mock("@/components/owner-select", () => ({
  OwnerSelect: (props: {
    id?: string
    value: string | null
    onChange: (id: string | null, fullName: string | null) => void
  }) => (
    <input
      id={props.id}
      aria-label={props.id}
      value={props.value ?? ""}
      onChange={(event) =>
        props.onChange(event.target.value || null, event.target.value || null)
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
  update.mockResolvedValue({ id: "p1" })
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
    expect(
      await screen.findByText(/Se puede dejar sin propietario/)
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    await user.type(screen.getByLabelText("property-amenities"), "a1")
    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    // Publicación: alquiler por defecto, todo lo demás opcional.
    expect(screen.getByRole("radio", { name: "Alquiler" })).toHaveAttribute(
      "aria-checked",
      "true"
    )
    await user.click(screen.getByRole("button", { name: "Siguiente" }))

    const photo = new File(["x"], "frente.png", { type: "image/png" })
    await user.upload(screen.getByLabelText(/Agregar fotos/), photo)
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/propiedades/p1"))
    expect(create).toHaveBeenCalledWith({
      address: "Calle 7 1234",
      locationId: "loc-1",
      propertyTypeId: "type-1",
      ownerId: null,
      amenityIds: ["a1"],
      notes: null,
      listingOperation: "RENT",
      listingPrice: undefined,
      listingCurrency: "ARS",
      publicDescription: undefined,
      rooms: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      totalAreaM2: undefined,
      coveredAreaM2: undefined,
      ageYears: undefined,
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

async function goToListingStep(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 3; i++) {
    await user.click(screen.getByRole("button", { name: "Siguiente" }))
  }
}

describe("PropertyForm (campos de publicación)", () => {
  it("manda operación, precio, ambientes y superficies cargados", async () => {
    render(<PropertyForm />)
    const user = userEvent.setup()
    await fillStepOne(user)
    await goToListingStep(user)

    await user.click(screen.getByRole("radio", { name: "Venta" }))
    await user.type(screen.getByLabelText("Precio"), "150.000,50")
    await user.selectOptions(screen.getByLabelText("Moneda"), "USD")
    await user.type(screen.getByLabelText("Ambientes"), "4")
    await user.type(screen.getByLabelText("Dormitorios"), "3")
    await user.type(screen.getByLabelText("Baños"), "2")
    await user.type(screen.getByLabelText("Superficie total (m²)"), "85,5")
    await user.type(screen.getByLabelText("Superficie cubierta (m²)"), "70")
    await user.type(screen.getByLabelText("Antigüedad (años)"), "12")
    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }))

    await waitFor(() => expect(create).toHaveBeenCalled())
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        listingOperation: "SALE",
        listingPrice: "150000.50",
        listingCurrency: "USD",
        rooms: 4,
        bedrooms: 3,
        bathrooms: 2,
        totalAreaM2: 85.5,
        coveredAreaM2: 70,
        ageYears: 12,
      })
    )
  })

  it("valida los rangos de la API antes de avanzar", async () => {
    render(<PropertyForm />)
    const user = userEvent.setup()
    await fillStepOne(user)
    await goToListingStep(user)

    await user.type(screen.getByLabelText("Dormitorios"), "100")
    await user.type(screen.getByLabelText("Superficie total (m²)"), "10,555")
    await user.type(screen.getByLabelText("Antigüedad (años)"), "501")
    await user.type(screen.getByLabelText("Precio"), "abc")
    await user.click(screen.getByRole("button", { name: "Siguiente" }))

    expect(
      await screen.findByText(
        "Ingresá un precio válido, por ejemplo 150000 o 150.000,50."
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText("Ingresá un número entero de 0 a 99.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Ingresá un número entero de 0 a 500.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Ingresá los m² con hasta 2 decimales.")
    ).toBeInTheDocument()
    expect(screen.getByText(/4\. Publicación/)).toHaveAttribute(
      "aria-current",
      "step"
    )
    expect(create).not.toHaveBeenCalled()
  })

  it("al editar, un campo vaciado se manda como null", async () => {
    const property = {
      id: "p1",
      address: "Calle 7 1234",
      locationId: "loc-1",
      propertyTypeId: "type-1",
      ownerId: null,
      amenityIds: [],
      notes: null,
      listingOperation: "SALE",
      listingPrice: "90000.00",
      listingCurrency: "USD",
      publicDescription: "Linda",
      rooms: 4,
      bedrooms: 3,
      bathrooms: null,
      totalAreaM2: 85.5,
      coveredAreaM2: null,
      ageYears: 12,
    } as unknown as PropertyDetail
    render(<PropertyForm property={property} />)
    const user = userEvent.setup()
    await goToListingStep(user)

    expect(screen.getByRole("radio", { name: "Venta" })).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(screen.getByLabelText("Precio")).toHaveValue("90000.00")
    expect(screen.getByLabelText("Dormitorios")).toHaveValue("3")
    await user.clear(screen.getByLabelText("Dormitorios"))
    await user.clear(screen.getByLabelText("Precio"))
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        listingPrice: null,
        bedrooms: null,
        bathrooms: null,
        rooms: 4,
        coveredAreaM2: null,
        totalAreaM2: 85.5,
      })
    )
  })
})
