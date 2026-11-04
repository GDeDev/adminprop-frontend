import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  ListingChannelDto,
  PropertyListingDto,
} from "@adminprop/shared-types"

import { PublicationSection } from "./publication-section"

const act = vi.fn()
let listings: PropertyListingDto[] = []
let channels: ListingChannelDto[] = []
let jobStatus: unknown = undefined

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))
vi.mock("@/lib/jobs-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/jobs-api")>()),
  useJobStatus: () => ({ data: jobStatus }),
}))
vi.mock("@/lib/crm-api", () => ({
  usePropertyAnalytics: () => ({
    isPending: false,
    isError: false,
    data: {
      views: 40,
      inquiries: 5,
      conversionRate: "20.0",
      byStage: { NEW: 2, CLOSED_WON: 1 },
      bySource: { PORTAL: 5 },
      daily: [],
    },
  }),
}))
vi.mock("@/lib/listings-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/listings-api")>()),
  useChannels: () => ({ data: channels }),
  usePropertyListings: () => ({
    isPending: false,
    isError: false,
    data: listings,
  }),
  useListingAction: () => ({ mutateAsync: act, isPending: false }),
}))

const listing = (extra: Partial<PropertyListingDto>): PropertyListingDto => ({
  channel: "MERCADOLIBRE",
  status: "NOT_PUBLISHED",
  externalUrl: null,
  publishedAt: null,
  lastSyncedAt: null,
  lastError: null,
  hasUnpublishedChanges: false,
  canPublish: true,
  missingForPublish: [],
  ...extra,
})
const channel = (extra: Partial<ListingChannelDto>): ListingChannelDto => ({
  channel: "MERCADOLIBRE",
  status: "CONNECTED",
  accountLabel: null,
  connectedAt: null,
  lastError: null,
  unavailableReason: null,
  ...extra,
})

afterEach(() => {
  vi.clearAllMocks()
  jobStatus = undefined
})

describe("PublicationSection", () => {
  it("publica y muestra el progreso del trabajo", async () => {
    listings = [listing({})]
    channels = [channel({})]
    act.mockResolvedValue({ jobId: "j1" })
    const user = userEvent.setup()
    render(<PublicationSection propertyId="p1" />)
    await user.click(screen.getByRole("button", { name: "Publicar" }))
    expect(act).toHaveBeenCalledWith({
      channel: "MERCADOLIBRE",
      action: "publish",
    })
    expect(await screen.findByRole("status")).toHaveTextContent("Publicando")
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled()
  })

  it("lista lo que falta cuando no está lista", () => {
    listings = [
      listing({ canPublish: false, missingForPublish: ["Fotos", "Precio"] }),
    ]
    channels = [channel({})]
    render(<PublicationSection propertyId="p1" />)
    expect(screen.getByText("Fotos")).toBeInTheDocument()
    expect(screen.getByText("Precio")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull()
  })

  it("ofrece actualizar, pausar y cerrar una publicada con cambios", () => {
    listings = [
      listing({
        status: "PUBLISHED",
        hasUnpublishedChanges: true,
        externalUrl: "https://fake.local/items/1",
      }),
    ]
    channels = [channel({})]
    render(<PublicationSection propertyId="p1" />)
    expect(screen.getByText("Hay cambios sin publicar.")).toBeInTheDocument()
    for (const name of ["Actualizar publicación", "Pausar", "Cerrar"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument()
    }
    expect(
      screen.getByRole("link", { name: /Ver publicación/ })
    ).toHaveAttribute("href", "https://fake.local/items/1")
  })

  it("con error ofrece reintentar y muestra el motivo", async () => {
    listings = [listing({ status: "ERROR", lastError: "Token vencido" })]
    channels = [channel({ status: "ERROR" })]
    act.mockResolvedValue({ jobId: "j2" })
    const user = userEvent.setup()
    render(<PublicationSection propertyId="p1" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Token vencido")
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    await waitFor(() =>
      expect(act).toHaveBeenCalledWith({
        channel: "MERCADOLIBRE",
        action: "retry",
      })
    )
  })

  it("canal sin conectar o no disponible: sin acciones", () => {
    listings = [
      listing({}),
      listing({ channel: "ZONAPROP", canPublish: false }),
    ]
    channels = [
      channel({ status: "DISCONNECTED" }),
      channel({
        channel: "ZONAPROP",
        status: "UNAVAILABLE",
        unavailableReason: "Requiere acuerdo comercial",
      }),
    ]
    render(<PublicationSection propertyId="p1" />)
    expect(screen.queryByRole("button", { name: "Publicar" })).toBeNull()
    expect(screen.getByRole("link", { name: "Conectarlo" })).toHaveAttribute(
      "href",
      "/configuracion/canales"
    )
    expect(screen.getByText("Requiere acuerdo comercial")).toBeInTheDocument()
  })

  it("muestra las analíticas de la propiedad", () => {
    listings = []
    channels = []
    render(<PublicationSection propertyId="p1" />)
    expect(screen.getByText("40")).toBeInTheDocument()
    expect(screen.getByText("20,0 %")).toBeInTheDocument()
    expect(
      screen.getByText(/desde la fecha en que se activó/)
    ).toBeInTheDocument()
  })
})
