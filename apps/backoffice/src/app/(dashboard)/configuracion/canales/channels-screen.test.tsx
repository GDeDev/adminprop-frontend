import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ListingChannelDto } from "@adminprop/shared-types"

import { ChannelsScreen } from "./channels-screen"

const connect = vi.fn()
const disconnect = vi.fn()
let role = "ADMIN"
let channels: ListingChannelDto[] = []
let state = { isPending: false, isError: false } as {
  isPending: boolean
  isError: boolean
  error?: unknown
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("connected=mercadolibre"),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } }),
}))
vi.mock("@/lib/listings-api", () => ({
  useChannels: () => ({
    ...state,
    data: state.isPending ? undefined : channels,
  }),
  useConnectMercadoLibre: () => ({ mutateAsync: connect, isPending: false }),
  useDisconnectChannel: () => ({ mutateAsync: disconnect, isPending: false }),
}))

const base = {
  accountLabel: null,
  connectedAt: null,
  lastError: null,
  unavailableReason: null,
}

afterEach(() => {
  vi.clearAllMocks()
  role = "ADMIN"
  state = { isPending: false, isError: false }
})

describe("ChannelsScreen", () => {
  it("muestra Mercado Libre y los portales no disponibles", () => {
    channels = [
      { ...base, channel: "MERCADOLIBRE", status: "DISCONNECTED" },
      {
        ...base,
        channel: "ZONAPROP",
        status: "UNAVAILABLE",
        unavailableReason: "Requiere acuerdo comercial",
      },
      { ...base, channel: "ARGENPROP", status: "UNAVAILABLE" },
    ]
    render(<ChannelsScreen />)
    expect(screen.getByRole("status")).toHaveTextContent("quedó conectado")
    expect(screen.getByRole("button", { name: "Conectar" })).toBeInTheDocument()
    expect(screen.getByText("Requiere acuerdo comercial")).toBeInTheDocument()
    expect(screen.getAllByText("No disponible")).toHaveLength(2)
  })

  it("conectado ofrece reconectar y desconectar con aviso", async () => {
    channels = [
      {
        ...base,
        channel: "MERCADOLIBRE",
        status: "CONNECTED",
        accountLabel: "INMOB_TEST",
      },
    ]
    disconnect.mockResolvedValue({})
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    expect(screen.getByText("INMOB_TEST")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Reconectar" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Desconectar" }))
    expect(
      await screen.findByText(/publicaciones activas siguen en Mercado Libre/)
    ).toBeInTheDocument()
    await user.click(
      screen.getAllByRole("button", { name: "Desconectar" }).at(-1)!
    )
    expect(disconnect).toHaveBeenCalledWith("MERCADOLIBRE")
  })

  it("sólo para administradores", () => {
    role = "EMPLOYEE"
    channels = []
    render(<ChannelsScreen />)
    expect(screen.getByText("Sólo para administradores")).toBeInTheDocument()
  })

  it("canal con error: avisa, no muestra el texto crudo y ofrece reconectar", () => {
    channels = [
      {
        ...base,
        channel: "MERCADOLIBRE",
        status: "ERROR",
        lastError: "Request failed with status code 401",
      },
    ]
    render(<ChannelsScreen />)
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Reconectá la cuenta")
    expect(alert).not.toHaveTextContent("status code")
    expect(screen.getByText("Con error")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Reconectar" })
    ).toBeInTheDocument()
  })

  it("Conectar pide la URL de autorización y redirige", async () => {
    channels = [{ ...base, channel: "MERCADOLIBRE", status: "DISCONNECTED" }]
    connect.mockResolvedValue({ authorizeUrl: "https://auth.example/ml" })
    const assign = vi.fn()
    vi.stubGlobal("location", { ...window.location, assign })
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    await user.click(screen.getByRole("button", { name: "Conectar" }))
    await vi.waitFor(() =>
      expect(assign).toHaveBeenCalledWith("https://auth.example/ml")
    )
    vi.unstubAllGlobals()
  })

  it("si no se puede iniciar la conexión, no redirige", async () => {
    channels = [{ ...base, channel: "MERCADOLIBRE", status: "DISCONNECTED" }]
    connect.mockRejectedValue(new Error("boom"))
    const assign = vi.fn()
    vi.stubGlobal("location", { ...window.location, assign })
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    await user.click(screen.getByRole("button", { name: "Conectar" }))
    await vi.waitFor(() => expect(connect).toHaveBeenCalled())
    expect(assign).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it("cargando no muestra canales", () => {
    state = { isPending: true, isError: false }
    channels = []
    render(<ChannelsScreen />)
    expect(screen.queryByRole("button", { name: "Conectar" })).toBeNull()
  })

  it("si falla la carga, mensaje en español y no el error crudo", () => {
    state = {
      isPending: false,
      isError: true,
      error: new Error("ECONNREFUSED"),
    }
    channels = []
    render(<ChannelsScreen />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar los canales."
    )
  })
})
