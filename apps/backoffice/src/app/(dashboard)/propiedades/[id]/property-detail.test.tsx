import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { PropertyDetail } from "@adminprop/shared-types"

import { PropertyDetailScreen } from "./property-detail"

let role = "EMPLOYEE"
let property: PropertyDetail
const changeStatus = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } }),
}))
vi.mock("@/lib/properties-api", () => ({
  useProperty: () => ({ isPending: false, isError: false, data: property }),
  useChangePropertyStatus: () => ({
    mutateAsync: changeStatus,
    isPending: false,
  }),
  useDeleteProperty: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePropertyPhoto: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadPropertyPhotos: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
// La sección de servicios tiene sus propios tests: acá, sin servicios.
vi.mock("@/lib/services-api", () => ({
  usePropertyServices: () => ({ isPending: false, isError: false, data: [] }),
  useCreateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteService: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

// La tasación y la publicación tienen sus propios tests.
vi.mock("./appraisal-section", () => ({ AppraisalSection: () => null }))
vi.mock("./publication-section", () => ({ PublicationSection: () => null }))

function makeProperty(overrides: Partial<PropertyDetail> = {}): PropertyDetail {
  return {
    id: "p1",
    listingPrice: null,
    listingCurrency: "ARS",
    publicDescription: null,
    address: "Calle 7 1234",
    status: "AVAILABLE",
    ownerId: null,
    activeContractId: null,
    owner: null,
    location: {
      id: "l1",
      name: "Tolosa",
      isActive: true,
      level: "NEIGHBORHOOD",
      path: "Tolosa, La Plata, Buenos Aires",
    },
    propertyType: { id: "t1", name: "Casa", isActive: false },
    mainPhotoUrl: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    locationId: "l1",
    propertyTypeId: "t1",
    amenityIds: ["a1"],
    amenities: [{ id: "a1", name: "Pileta", isActive: true, icon: "waves" }],
    notes: "Llave en portería",
    photos: [],
    listingOperation: "RENT",
    bedrooms: null,
    bathrooms: null,
    rooms: null,
    totalAreaM2: null,
    coveredAreaM2: null,
    ageYears: null,
    latitude: null,
    longitude: null,
    ...overrides,
  }
}

afterEach(() => {
  role = "EMPLOYEE"
  vi.clearAllMocks()
})

describe("Ficha de propiedad", () => {
  it("sin fotos muestra un lugar vacío en vez del carrusel", () => {
    property = makeProperty()
    render(<PropertyDetailScreen id="p1" />)

    expect(screen.getByText("Sin fotos")).toBeInTheDocument()
    expect(screen.queryByRole("list", { name: /Fotos de/ })).toBeNull()
  })

  it("muestra ubicación, amenities, notas y un tipo desactivado como dato histórico", () => {
    property = makeProperty()
    render(<PropertyDetailScreen id="p1" />)

    expect(
      screen.getAllByText(/Tolosa, La Plata, Buenos Aires/).length
    ).toBeGreaterThan(0)
    expect(screen.getByText("Pileta")).toBeInTheDocument()
    expect(screen.getByText("Llave en portería")).toBeInTheDocument()
    expect(screen.getByText("(desactivado)")).toBeInTheDocument()
  })

  it("muestra operación, precio y características; sin cargar, «Consultar»", () => {
    property = makeProperty()
    const { unmount } = render(<PropertyDetailScreen id="p1" />)
    expect(screen.getByText("Alquiler")).toBeInTheDocument()
    expect(screen.getByText("Consultar")).toBeInTheDocument()
    expect(screen.queryByText("Dormitorios")).toBeNull()
    unmount()

    property = makeProperty({
      listingOperation: "SALE",
      listingPrice: "150000.00",
      listingCurrency: "USD",
      bedrooms: 3,
      rooms: 4,
      totalAreaM2: 85.5,
      ageYears: 1,
    })
    render(<PropertyDetailScreen id="p1" />)
    expect(screen.getByText("Venta")).toBeInTheDocument()
    expect(screen.getByText(/150\.000/)).toBeInTheDocument()
    expect(screen.getByText("Dormitorios").nextSibling).toHaveTextContent("3")
    expect(screen.getByText("Superficie total").nextSibling).toHaveTextContent(
      "85,5 m²"
    )
    expect(screen.getByText("Antigüedad").nextSibling).toHaveTextContent(
      "1 año"
    )
    expect(screen.queryByText("Baños")).toBeNull()
  })

  it("ofrece sólo las transiciones de estado permitidas", async () => {
    property = makeProperty({ status: "MAINTENANCE" })
    render(<PropertyDetailScreen id="p1" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Cambiar estado" }))
    const options = await screen.findAllByRole("menuitem")

    expect(options.map((o) => o.textContent)).toEqual(["Pasar a disponible"])
    await user.click(options[0]!)
    expect(changeStatus).toHaveBeenCalledWith({ id: "p1", status: "AVAILABLE" })
  })

  it("solo un admin ve el botón de eliminar", () => {
    property = makeProperty()
    const { unmount } = render(<PropertyDetailScreen id="p1" />)
    expect(
      screen.queryByRole("button", { name: "Eliminar propiedad" })
    ).toBeNull()
    unmount()

    role = "ADMIN"
    render(<PropertyDetailScreen id="p1" />)
    expect(
      screen.getByRole("button", { name: "Eliminar propiedad" })
    ).toBeInTheDocument()
  })
})
