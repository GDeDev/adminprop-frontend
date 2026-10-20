import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { renderWithQuery } from "../../../../../test/render"
import { MasterDataScreen } from "./master-data-screen"

let role = "ADMIN"
const get = vi.fn()
const patch = vi.fn()
const warning = vi.fn()

vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role } }),
}))

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
    post: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: (m: string) => warning(m),
  },
}))

const stamp = { createdAt: "2026-01-01", updatedAt: "2026-01-01" }

const node = (
  id: string,
  name: string,
  level: string,
  isActive: boolean,
  children: unknown[] = []
) => ({ id, name, level, isActive, parentId: null, children, ...stamp })

const TREE = [
  node("ar", "Argentina", "COUNTRY", true, [
    node("ba", "Buenos Aires", "PROVINCE", false, [
      node("lp", "La Plata", "CITY", false),
    ]),
  ]),
]

get.mockImplementation(async (url: string) => ({
  data: {
    success: true,
    data:
      url === "/locations/tree"
        ? TREE
        : [
            { id: "t1", name: "Casa", icon: null, isActive: true, ...stamp },
            { id: "t2", name: "Galpón", icon: null, isActive: false, ...stamp },
          ],
  },
}))
patch.mockResolvedValue({ data: {} })

afterEach(() => {
  role = "ADMIN"
  get.mockClear()
  patch.mockClear()
  warning.mockClear()
})

describe("Configuración → Maestros", () => {
  it("un admin ve activos y desactivados, y puede desactivar", async () => {
    renderWithQuery(<MasterDataScreen />)
    const user = userEvent.setup()

    expect(await screen.findByText("Galpón")).toBeInTheDocument()
    expect(screen.getByText("1 activos de 2")).toBeInTheDocument()

    await user.click(screen.getByRole("switch", { name: "Casa: activo" }))

    expect(patch).toHaveBeenCalledWith("/property-types/t1/deactivate")
  })

  it("un empleado la ve pero no la puede cambiar", async () => {
    role = "EMPLOYEE"
    renderWithQuery(<MasterDataScreen />)

    expect(await screen.findByText("Casa")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Agregar/ })).toBeNull()
    expect(screen.queryByRole("switch")).toBeNull()
    expect(
      screen.getByText(/Sólo un administrador puede cambiarlas/)
    ).toBeInTheDocument()
  })

  it("ubicaciones: reactivar bajo un padre desactivado se permite, con aviso", async () => {
    renderWithQuery(<MasterDataScreen />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("tab", { name: "Ubicaciones" }))
    const tree = await screen.findByRole("tree")
    // Los países arrancan abiertos; la provincia hay que abrirla.
    await user.click(
      within(tree).getByRole("button", { name: "Abrir Buenos Aires" })
    )
    await user.click(
      screen.getByRole("switch", { name: "La Plata: desactivada" })
    )

    expect(patch).toHaveBeenCalledWith("/locations/lp/activate")
    await waitFor(() =>
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining('"Buenos Aires" sigue desactivada')
      )
    )
  })
})
