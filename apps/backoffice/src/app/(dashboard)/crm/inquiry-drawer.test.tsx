import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { InquiryDetail } from "@adminprop/shared-types"

import { makeCard } from "@/test-utils/crm-fixtures"

import { InquiryDrawer } from "./inquiry-drawer"

const addNote = vi.fn()
const assign = vi.fn()
const update = vi.fn()
const attempt = vi.fn()
const whatsapp = vi.fn()
let inquiryState: Record<string, unknown> = {}
let templates: { key: string; title: string }[] = []

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/lib/crm-api", () => ({
  useInquiry: () => inquiryState,
  useAssignees: () => ({
    data: [{ id: "u1", fullName: "Ana Pérez", role: "EMPLOYEE" }],
  }),
  useAddNote: () => ({ mutateAsync: addNote, isPending: false }),
  useAssignInquiry: () => ({ mutateAsync: assign, isPending: false }),
  useUpdateInquiry: () => ({ mutateAsync: update, isPending: false }),
  useContactAttempt: () => ({ mutateAsync: attempt, isPending: false }),
  fetchWhatsAppLink: (...args: unknown[]) => whatsapp(...args),
}))
vi.mock("@/lib/notifications-api", () => ({
  useWhatsAppTemplates: () => ({ data: templates }),
}))
vi.mock("@/components/property-select", () => ({
  PropertySelect: () => <div>selector de propiedad</div>,
}))

function detail(extra: Partial<InquiryDetail> = {}): InquiryDetail {
  return {
    ...makeCard("a", "CONTACTED", {
      email: "ana@example.com",
      property: { id: "p", address: "Mitre 100" },
      assignedTo: { id: "u1", fullName: "Ana Pérez" },
    }),
    message: "Hola, ¿sigue disponible?",
    lostReason: null,
    closedAt: null,
    contractId: null,
    activities: [
      {
        id: "1",
        type: "CREATED",
        author: null,
        payload: {},
        createdAt: "2026-11-01T10:00:00Z",
      },
      {
        id: "2",
        type: "NOTE",
        author: { id: "u1", fullName: "Ana Pérez" },
        payload: { body: "Quedamos en llamar mañana" },
        createdAt: "2026-11-02T10:00:00Z",
      },
      {
        id: "3",
        type: "STAGE_CHANGED",
        author: { id: "u1", fullName: "Ana Pérez" },
        payload: { from: "NEW", to: "CONTACTED" },
        createdAt: "2026-11-01T12:00:00Z",
      },
    ],
    ...extra,
  }
}

function open(
  onMove = vi.fn(),
  stageCards = vi.fn(() => [makeCard("z", "VISIT_SCHEDULED")])
) {
  render(
    <InquiryDrawer
      id="a"
      onClose={vi.fn()}
      onMove={onMove}
      stageCards={stageCards}
    />
  )
  return { onMove, stageCards }
}

afterEach(() => {
  vi.clearAllMocks()
  templates = []
})

describe("InquiryDrawer", () => {
  it("cargando muestra un esqueleto y sin datos", () => {
    inquiryState = { isPending: true, isError: false }
    open()
    expect(screen.queryByText("Historial")).toBeNull()
  })

  it("con error no muestra el mensaje crudo", () => {
    inquiryState = {
      isPending: false,
      isError: true,
      error: new Error("Request failed with status code 500"),
    }
    open()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cargar la consulta."
    )
    expect(screen.queryByText(/status code/)).toBeNull()
  })

  it("el historial va de lo más nuevo a lo más viejo, con notas y autor", () => {
    inquiryState = { isPending: false, isError: false, data: detail() }
    open()
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent(/Nota:\s*Quedamos en llamar mañana/)
    expect(items[1]).toHaveTextContent("Pasó de «Nueva» a «Contactada»")
    expect(items[2]).toHaveTextContent("Consulta creada")
    expect(items[2]).toHaveTextContent("Sistema")
    expect(screen.getByText("Hola, ¿sigue disponible?")).toBeInTheDocument()
  })

  it("muestra el motivo de una consulta perdida", () => {
    inquiryState = {
      isPending: false,
      isError: false,
      data: detail({
        stage: "CLOSED_LOST",
        lostReason: "Precio",
        closedAt: "2026-11-03T10:00:00Z",
      }),
    }
    open()
    expect(screen.getByText("Motivo: Precio")).toBeInTheDocument()
    expect(screen.getByText(/Cerrada el/)).toBeInTheDocument()
  })

  it("agrega una nota, la limpia y no deja agregar una vacía", async () => {
    inquiryState = { isPending: false, isError: false, data: detail() }
    addNote.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    const submit = screen.getByRole("button", { name: "Agregar nota" })
    expect(submit).toBeDisabled()
    const box = screen.getByLabelText("Agregar una nota")
    expect(box).toHaveAttribute("maxlength", "2000")
    await user.type(box, "  Pidió ver el patio ")
    await user.click(submit)
    expect(addNote).toHaveBeenCalledWith({ body: "Pidió ver el patio" })
    await waitFor(() => expect(box).toHaveValue(""))
  })

  it("si falla la nota avisa y conserva el texto", async () => {
    inquiryState = { isPending: false, isError: false, data: detail() }
    addNote.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    open()
    const box = screen.getByLabelText("Agregar una nota")
    await user.type(box, "Texto importante")
    await user.click(screen.getByRole("button", { name: "Agregar nota" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(box).toHaveValue("Texto importante")
  })

  it("cambiar la etapa pasa por el flujo de movimiento con las tarjetas de destino", async () => {
    inquiryState = { isPending: false, isError: false, data: detail() }
    const user = userEvent.setup()
    const { onMove, stageCards } = open()
    await user.click(screen.getByRole("combobox", { name: "Etapa" }))
    await user.click(
      await screen.findByRole("option", { name: "Visita agendada" })
    )
    expect(stageCards).toHaveBeenCalledWith("VISIT_SCHEDULED")
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
      "VISIT_SCHEDULED",
      [expect.objectContaining({ id: "z" })],
      1
    )
  })

  it("desasigna con userId null", async () => {
    inquiryState = { isPending: false, isError: false, data: detail() }
    assign.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole("combobox", { name: "Asignada a" }))
    await user.click(await screen.findByRole("option", { name: "Sin asignar" }))
    expect(assign).toHaveBeenCalledWith({ id: "a", userId: null })
  })

  it("si no se puede asignar muestra el motivo en español", async () => {
    inquiryState = { isPending: false, isError: false, data: detail() }
    assign.mockRejectedValue({
      isAxiosError: true,
      response: { data: { code: "ASSIGNEE_INVALID" } },
    })
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole("combobox", { name: "Asignada a" }))
    await user.click(await screen.findByRole("option", { name: "Sin asignar" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(vi.mocked(toast.error).mock.calls[0]![0]).not.toMatch(
      /ASSIGNEE_INVALID/
    )
  })

  it("guarda el seguimiento y exige un medio de contacto", async () => {
    inquiryState = {
      isPending: false,
      isError: false,
      data: detail({ nextActionAt: "2026-11-10" }),
    }
    update.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    const form = screen.getByRole("form", { name: "Datos de la consulta" })
    await user.clear(within(form).getByLabelText("Próximo seguimiento"))
    await user.click(
      within(form).getByRole("button", { name: "Guardar cambios" })
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Cliente a",
        email: "ana@example.com",
        phone: "1155550000",
        nextActionAt: null,
      })
    )
    await user.clear(within(form).getByLabelText("Email"))
    await user.clear(within(form).getByLabelText("Teléfono"))
    expect(
      within(form).getByText("Cargá al menos un email o un teléfono.")
    ).toBeInTheDocument()
    expect(
      within(form).getByRole("button", { name: "Guardar cambios" })
    ).toBeDisabled()
  })

  it("registra un llamado o un email como intento de contacto", async () => {
    inquiryState = { isPending: false, isError: false, data: detail() }
    attempt.mockResolvedValue({})
    const user = userEvent.setup()
    open()
    await user.click(screen.getByRole("button", { name: "Registrar llamado" }))
    expect(attempt).toHaveBeenCalledWith({ id: "a", channel: "PHONE" })
    await user.click(screen.getByRole("button", { name: "Registrar email" }))
    expect(attempt).toHaveBeenCalledWith({ id: "a", channel: "EMAIL" })
    expect(
      screen.getByText("Todavía no se registró ningún contacto.")
    ).toBeInTheDocument()
  })

  it("sin teléfono ni email no ofrece registrar contactos", () => {
    inquiryState = {
      isPending: false,
      isError: false,
      data: detail({ phone: null, email: null, hasWhatsApp: false }),
    }
    open()
    expect(
      screen.queryByRole("button", { name: "Registrar llamado" })
    ).toBeNull()
    expect(screen.queryByRole("button", { name: "Registrar email" })).toBeNull()
  })

  it("WhatsApp usa la plantilla elegida y sólo aparece si la consulta lo permite", async () => {
    templates = [
      { key: "INQUIRY_FIRST_CONTACT", title: "Primer contacto" },
      { key: "VISIT", title: "Coordinar visita" },
    ]
    inquiryState = { isPending: false, isError: false, data: detail() }
    whatsapp.mockResolvedValue({ url: "https://wa.me/549", message: "Hola" })
    attempt.mockResolvedValue({})
    vi.spyOn(window, "open").mockReturnValue({
      location: { href: "" },
      close: vi.fn(),
      opener: null,
    } as unknown as Window)
    const user = userEvent.setup()
    open()
    await user.click(
      screen.getByRole("combobox", { name: "Plantilla de WhatsApp" })
    )
    await user.click(
      await screen.findByRole("option", { name: "Coordinar visita" })
    )
    await user.click(
      screen.getByRole("button", { name: "Enviar por WhatsApp" })
    )
    await waitFor(() => expect(whatsapp).toHaveBeenCalledWith("a", "VISIT"))
    await waitFor(() =>
      expect(attempt).toHaveBeenCalledWith({ id: "a", channel: "WHATSAPP" })
    )
  })

  it("sin WhatsApp en la consulta no muestra el botón", () => {
    inquiryState = {
      isPending: false,
      isError: false,
      data: detail({ hasWhatsApp: false }),
    }
    open()
    expect(
      screen.queryByRole("button", { name: "Enviar por WhatsApp" })
    ).toBeNull()
  })
})
