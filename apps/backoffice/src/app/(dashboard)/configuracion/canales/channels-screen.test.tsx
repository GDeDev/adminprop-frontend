import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ListingChannelDto } from "@adminprop/shared-types"

import { ChannelsScreen } from "./channels-screen"

const connect = vi.fn()
const disconnect = vi.fn()
let role = "ADMIN"
let channels: ListingChannelDto[] = []

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
  useChannels: () => ({ isPending: false, isError: false, data: channels }),
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
})
