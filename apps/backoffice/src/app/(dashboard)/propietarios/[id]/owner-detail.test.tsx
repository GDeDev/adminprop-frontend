import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { OwnerDetail, User } from "@adminprop/shared-types"

import { OwnerDetailScreen } from "./owner-detail"

const ADMIN = { id: "u1", role: "ADMIN" } as User
const EMPLOYEE = { id: "u2", role: "EMPLOYEE" } as User
let sessionUser: User = ADMIN
let owner: OwnerDetail

function makeOwner(overrides: Partial<OwnerDetail> = {}): OwnerDetail {
  return {
    id: "owner-1",
    firstName: "José",
    lastName: "Pérez",
    fullName: "José Pérez",
    nationalId: "20123456",
    phone: "11 5555-1234",
    email: "jose@demo.local",
    address: null,
    notes: null,
    propertyCount: 1,
    activePropertyCount: 1,
    reducedFee: false,
    hasPortalAccess: false,
    bankAccount: {
      cbu: "0170099220000067891234",
      alias: "jose.perez",
      bankName: "BBVA",
      holder: "José Pérez",
    },
    properties: [
      {
        id: "p1",
        address: "Calle 7 1234",
        status: "RENTED",
        mainPhotoUrl: null,
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

const issue = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: sessionUser }),
}))
vi.mock("@/lib/owners-api", () => ({
  useOwner: () => ({ isPending: false, isError: false, data: owner }),
  useOwnerDataCheck: () => ({ data: undefined }),
  useUpdateOwnerBankAccount: () => ({ mutateAsync: vi.fn() }),
  useIssueOwnerPortalCredentials: () => ({
    mutateAsync: issue,
    isPending: false,
  }),
  useDeleteOwner: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

afterEach(() => {
  sessionUser = ADMIN
  owner = makeOwner()
  vi.clearAllMocks()
})

describe("OwnerDetailScreen", () => {
  it("muestra la cuenta bancaria en bloques, sus propiedades y el botón de eliminar al admin", () => {
    owner = makeOwner()
    render(<OwnerDetailScreen id="owner-1" />)

    expect(screen.getByText("01700992 20000067891234")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Calle 7 1234" })).toHaveAttribute(
      "href",
      "/propiedades/p1"
    )
    expect(
      screen.getByRole("button", { name: "Eliminar propietario" })
    ).toBeInTheDocument()
  })

  it("un empleado no puede eliminar", () => {
    sessionUser = EMPLOYEE
    owner = makeOwner()
    render(<OwnerDetailScreen id="owner-1" />)

    expect(
      screen.queryByRole("button", { name: "Eliminar propietario" })
    ).not.toBeInTheDocument()
  })

  it("sin email no se puede generar el acceso al portal", () => {
    owner = makeOwner({ email: null })
    render(<OwnerDetailScreen id="owner-1" />)

    expect(
      screen.getByRole("button", { name: "Generar acceso" })
    ).toBeDisabled()
    expect(screen.getByText(/Cargale un email/)).toBeInTheDocument()
  })

  it("genera el acceso y muestra la contraseña una vez", async () => {
    owner = makeOwner()
    issue.mockResolvedValue({
      userId: "pu1",
      email: "jose@demo.local",
      password: "abc123XYZ789qwer",
    })
    render(<OwnerDetailScreen id="owner-1" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Generar acceso" }))
    await user.click(
      await screen.findByRole("button", {
        name: "Generar acceso",
        hidden: false,
      })
    )

    expect(issue).toHaveBeenCalledWith("owner-1")
    expect(await screen.findByText("abc123XYZ789qwer")).toBeInTheDocument()
    expect(screen.getByText(/no se vuelve a mostrar/)).toBeInTheDocument()
  })
})
