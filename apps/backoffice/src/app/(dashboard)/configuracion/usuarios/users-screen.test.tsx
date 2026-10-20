import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { User } from "@adminprop/shared-types"

import { UsersScreen } from "./users-screen"

const ADMIN: User = {
  id: "admin-1",
  tenantId: "t1",
  email: "admin@demo.local",
  firstName: "Ada",
  lastName: "Admin",
  role: "ADMIN",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const EMPLOYEE: User = {
  ...ADMIN,
  id: "emp-1",
  email: "empleado@demo.local",
  firstName: "Ernesto",
  lastName: "Empleado",
  role: "EMPLOYEE",
}

let sessionUser: User = ADMIN
const setActive = vi.fn()

vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: sessionUser }),
}))

vi.mock("@/lib/users-api", () => ({
  USERS_PAGE_SIZE: 20,
  useUsers: () => ({
    isPending: false,
    isError: false,
    data: {
      data: [ADMIN, EMPLOYEE],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  }),
  useSetUserActive: () => ({ mutateAsync: setActive }),
  useCreateUser: () => ({ mutateAsync: vi.fn() }),
  useUpdateUser: () => ({ mutateAsync: vi.fn() }),
  useResetUserPassword: () => ({ mutateAsync: vi.fn() }),
}))

afterEach(() => {
  sessionUser = ADMIN
  vi.clearAllMocks()
})

describe("UsersScreen", () => {
  it("un empleado no ve la gestión de usuarios", () => {
    sessionUser = EMPLOYEE

    render(<UsersScreen />)

    expect(screen.getByText("Sólo para administradores")).toBeInTheDocument()
    expect(screen.queryByText("Nuevo usuario")).not.toBeInTheDocument()
  })

  it("un admin ve la lista con rol y estado", () => {
    render(<UsersScreen />)

    const table = screen.getByRole("table")
    expect(within(table).getByText("Ernesto Empleado")).toBeInTheDocument()
    expect(within(table).getByText("Empleado")).toBeInTheDocument()
    expect(within(table).getByText("(vos)")).toBeInTheDocument()
  })

  it("sobre sí mismo sólo ofrece editar", async () => {
    render(<UsersScreen />)
    const user = userEvent.setup()

    const [, desktopSelf] = screen.getAllByRole("button", {
      name: "Acciones para Ada Admin",
    })
    await user.click(desktopSelf!)

    expect(
      await screen.findByRole("menuitem", { name: "Editar" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("menuitem", { name: /Desactivar/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("menuitem", { name: /Resetear/ })
    ).not.toBeInTheDocument()
  })

  it("desactiva a otro usuario", async () => {
    setActive.mockResolvedValue({})
    render(<UsersScreen />)
    const user = userEvent.setup()

    const [, desktopEmployee] = screen.getAllByRole("button", {
      name: "Acciones para Ernesto Empleado",
    })
    await user.click(desktopEmployee!)
    await user.click(
      await screen.findByRole("menuitem", { name: "Desactivar" })
    )

    expect(setActive).toHaveBeenCalledWith({ id: "emp-1", active: false })
  })
})
