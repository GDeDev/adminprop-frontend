import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { InquiryDetail } from "@adminprop/shared-types"

import { InquiryDrawer } from "./inquiry-drawer"

const addNote = vi.fn()
const update = vi.fn()
const assign = vi.fn()
const attempt = vi.fn()
let query: Record<string, unknown> = {}

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/lib/crm-api", () => ({
  useInquiry: () => query,
  useAssignees: () => ({
    data: [{ id: "u1", fullName: "Ana Pérez", role: "EMPLOYEE" }],
  }),
  useAssignInquiry: () => ({ mutateAsync: assign, isPending: false }),
  useUpdateInquiry: () => ({ mutateAsync: update, isPending: false }),
  useAddNote: () => ({ mutateAsync: addNote, isPending: false }),
  useContactAttempt: () => ({ mutateAsync: attempt, isPending: false }),
  fetchWhatsAppLink: vi.fn(),
}))
vi.mock("@/lib/notifications-api", () => ({
  useWhatsAppTemplates: () => ({ data: [] }),
}))
vi.mock("@/components/property-select", () => ({
  PropertySelect: () => <div>selector de propiedad</div>,
}))

const inquiry: InquiryDetail = {
  id: "i1",
  name: "Luz Gómez",
  email: null,
  phone: "1155550000",
  message: "Busco algo para marzo",
  stage: "CONTACTED",
  boardPosition: 1,
  source: "PORTAL",
  property: { id: "p1", address: "Mitre 100" },
  assignedTo: null,
  nextActionAt: null,
  lastContactAt: null,
  createdAt: "2026-11-01T10:00:00Z",
  ageHours: 5,
  hasWhatsApp: true,
  lostReason: null,
  closedAt: null,
  contractId: null,
  activities: [
    {
      id: "a1",
      type: "CREATED",
      author: null,
      payload: {},
      createdAt: "2026-11-01T10:00:00Z",
    },
    {
      id: "a2",
      type: "NOTE",
      author: { id: "u1", fullName: "Ana Pérez" },
      payload: { body: "Quiere ver el patio" },
      createdAt: "2026-11-02T10:00:00Z",
    },
  ],
}

function open(onMove = vi.fn()) {
  render(
    <InquiryDrawer
      id="i1"
      onClose={vi.fn()}
      onMove={onMove}
      stageCards={() => []}
    />
  )
  return onMove
}

afterEach(() => vi.clearAllMocks())

describe("InquiryDrawer", () => {
  it("cargando muestra un esqueleto y no el formulario", () => {
    query = { isPending: true, isError: false, data: undefined }
    open()
    expect(screen.queryByLabelText("Nombre")).toBeNull()
  })

  it("error: mensaje en español, sin texto crudo del servidor", () => {
    query = {
      isPending: false,
      isError: true,
      data: undefined,
      error: new Error("PrismaClientKnownRequestError: P2025"),
    }
    open()
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("No se pudo cargar la consulta.")
    expect(alert).not.toHaveTextContent("Prisma")
  })

  it("muestra la línea de tiempo con la nota más nueva primera", () => {
    query = { isPending: false, isError: false, data: inquiry }
    open()
    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items[0]).toHaveTextContent(/Nota:\s*Quiere ver el patio/)
    expect(items[0]).toHaveTextContent("Ana Pérez")
    expect(items[1]).toHaveTextContent("Consulta creada")
    expect(items[1]).toHaveTextContent("Sistema")
  })

  it("agrega una nota y limpia el campo", async () => {
    query = { isPending: false, isError: false, data: inquiry }
    addNote.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    const submit = screen.getByRole("button", { name: "Agregar nota" })
    expect(submit).toBeDisabled()
    await user.type(
      screen.getByLabelText("Agregar una nota"),
      " Llamar el lunes "
    )
    await user.click(submit)
    await waitFor(() =>
      expect(addNote).toHaveBeenCalledWith({ body: "Llamar el lunes" })
    )
    expect(screen.getByLabelText("Agregar una nota")).toHaveValue("")
  })

  it("cambiar la etapa pide el movimiento al final de la columna", async () => {
    query = { isPending: false, isError: false, data: inquiry }
    const user = userEvent.setup()
    const onMove = open()
    await user.click(screen.getByRole("combobox", { name: "Etapa" }))
    await user.click(await screen.findByRole("option", { name: "Perdida" }))
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "i1" }),
      "CLOSED_LOST",
      [],
      0
    )
  })

  it("asigna a un usuario", async () => {
    query = { isPending: false, isError: false, data: inquiry }
    assign.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole("combobox", { name: "Asignada a" }))
    await user.click(await screen.findByRole("option", { name: "Ana Pérez" }))
    expect(assign).toHaveBeenCalledWith({ id: "i1", userId: "u1" })
  })

  it("registra un llamado como intento de contacto", async () => {
    query = { isPending: false, isError: false, data: inquiry }
    attempt.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole("button", { name: "Llamado" }))
    expect(attempt).toHaveBeenCalledWith({ id: "i1", channel: "PHONE" })
    await user.click(screen.getByRole("button", { name: "Email" }))
    expect(attempt).toHaveBeenCalledWith({ id: "i1", channel: "EMAIL" })
  })

  it("guarda el seguimiento y bloquea si no queda ningún contacto", async () => {
    query = { isPending: false, isError: false, data: inquiry }
    update.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    await user.type(screen.getByLabelText("Próximo seguimiento"), "2026-11-10")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          nextActionAt: "2026-11-10",
          phone: "1155550000",
        })
      )
    )
    await user.clear(screen.getByLabelText("Teléfono"))
    expect(
      screen.getByRole("button", { name: "Guardar cambios" })
    ).toBeDisabled()
    expect(
      screen.getByText("Cargá al menos un email o un teléfono.")
    ).toBeVisible()
  })

  it("sin WhatsApp no ofrece el botón", () => {
    query = {
      isPending: false,
      isError: false,
      data: { ...inquiry, hasWhatsApp: false },
    }
    open()
    expect(screen.queryByRole("button", { name: /WhatsApp/ })).toBeNull()
  })
})
