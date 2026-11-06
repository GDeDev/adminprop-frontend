import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ListingChannelDto } from "@adminprop/shared-types"

import { ChannelsScreen } from "./channels-screen"

const connect = vi.fn()
const disconnect = vi.fn()
let role = "ADMIN"
let channels: ListingChannelDto[] = []
let queryState: Record<string, unknown> = {}
const refetch = vi.fn()

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
    isPending: false,
    isError: false,
    refetch,
    data: channels,
    ...queryState,
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
  queryState = {}
})

describe("ChannelsScreen", () => {
  it("muestra Mercado Libre y los portales no disponibles", () => {
    channels = [
      { ...base, channel: "MERCADOLIBRE", status: "CONNECTED" },
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

  it("solo para administradores", () => {
    role = "EMPLOYEE"
    channels = []
    render(<ChannelsScreen />)
    expect(screen.getByText("Solo para administradores")).toBeInTheDocument()
  })

  it("Mercado Libre desconectado ofrece conectar y no anuncia una conexión que no existe", () => {
    // El aviso depende del estado real, no sólo de ?connected= en la URL.
    channels = [{ ...base, channel: "MERCADOLIBRE", status: "DISCONNECTED" }]
    render(<ChannelsScreen />)
    expect(screen.queryByRole("status")).toBeNull()
    expect(screen.getByRole("button", { name: "Conectar" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Desconectar" })).toBeNull()
  })

  it("conectar pide la URL de autorización y va hacia ella", async () => {
    channels = [{ ...base, channel: "MERCADOLIBRE", status: "DISCONNECTED" }]
    connect.mockResolvedValue({
      authorizeUrl: "https://auth.mercadolibre.com/x",
    })
    const assignSpy = vi.fn()
    vi.stubGlobal("location", { assign: assignSpy })
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    await user.click(screen.getByRole("button", { name: "Conectar" }))
    await waitFor(() =>
      expect(assignSpy).toHaveBeenCalledWith("https://auth.mercadolibre.com/x")
    )
    vi.unstubAllGlobals()
  })

  it("si no se puede iniciar la conexión avisa en español", async () => {
    channels = [{ ...base, channel: "MERCADOLIBRE", status: "DISCONNECTED" }]
    connect.mockRejectedValue(new Error("socket hang up"))
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    await user.click(screen.getByRole("button", { name: "Conectar" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.error).toHaveBeenCalledWith("No se pudo iniciar la conexión.")
  })

  it("un canal con error muestra el problema y ofrece reconectar", () => {
    channels = [
      {
        ...base,
        channel: "MERCADOLIBRE",
        status: "ERROR",
        lastError: "El token venció.",
      },
    ]
    render(<ChannelsScreen />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La conexión con el portal falló: El token venció."
    )
    expect(
      screen.getByRole("button", { name: "Reconectar" })
    ).toBeInTheDocument()
  })

  it("cancelar el aviso de desconexión no desconecta", async () => {
    channels = [{ ...base, channel: "MERCADOLIBRE", status: "CONNECTED" }]
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    await user.click(screen.getByRole("button", { name: "Desconectar" }))
    await user.click(await screen.findByRole("button", { name: "Cancelar" }))
    expect(disconnect).not.toHaveBeenCalled()
  })

  it("si falla la desconexión avisa y no cierra sesión del canal", async () => {
    channels = [{ ...base, channel: "MERCADOLIBRE", status: "CONNECTED" }]
    disconnect.mockRejectedValue(new Error("x"))
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    await user.click(screen.getByRole("button", { name: "Desconectar" }))
    await user.click(
      screen.getAllByRole("button", { name: "Desconectar" }).at(-1)!
    )
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo desconectar el canal."
      )
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("cargando muestra un esqueleto y sin tarjetas", () => {
    channels = []
    queryState = { isPending: true, data: undefined }
    render(<ChannelsScreen />)
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("con error de carga no muestra el error crudo y permite reintentar", async () => {
    queryState = {
      isError: true,
      data: undefined,
      error: new Error("ECONNREFUSED"),
    }
    const user = userEvent.setup()
    render(<ChannelsScreen />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar los canales."
    )
    expect(screen.queryByText(/ECONNREFUSED/)).toBeNull()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })
})
