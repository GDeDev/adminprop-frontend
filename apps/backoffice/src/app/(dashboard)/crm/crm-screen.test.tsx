import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  InquiryCard,
  InquiryStage,
  PipelineDto,
} from "@adminprop/shared-types"

import { resolveDrop } from "./board"
import { InquiryCardView } from "./inquiry-card"
import { lostReasonValue } from "./move-flow"
import { NewInquiryDialog, buildCreateRequest } from "./new-inquiry-dialog"
import { StageTabs } from "./stage-tabs"

const create = vi.fn()
const attempt = vi.fn()
const whatsapp = vi.fn()

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/crm-api", () => ({
  useCreateInquiry: () => ({ mutateAsync: create, isPending: false }),
  useAssignees: () => ({
    data: [{ id: "u1", fullName: "Ana Pérez", role: "EMPLOYEE" }],
  }),
  useContactAttempt: () => ({ mutateAsync: attempt }),
  fetchWhatsAppLink: (...args: unknown[]) => whatsapp(...args),
  useInfiniteInquiries: () => ({
    data: undefined,
    hasNextPage: false,
    isFetching: false,
    fetchNextPage: vi.fn(),
  }),
}))

vi.mock("@/components/property-select", () => ({
  PropertySelect: () => <div>selector de propiedad</div>,
}))

function card(id: string, stage: InquiryStage, extra = {}): InquiryCard {
  return {
    id,
    name: `Cliente ${id}`,
    email: null,
    phone: "1155550000",
    message: "",
    stage,
    boardPosition: 1,
    source: "PORTAL",
    property: null,
    assignedTo: null,
    nextActionAt: null,
    lastContactAt: null,
    createdAt: "2026-11-01T10:00:00Z",
    ageHours: 3,
    hasWhatsApp: true,
    ...extra,
  }
}

const pipeline: PipelineDto = {
  columns: [
    {
      stage: "NEW",
      total: 2,
      cards: [
        card("a", "NEW"),
        card("b", "NEW", { property: { id: "p", address: "Mitre 100" } }),
      ],
    },
    { stage: "CONTACTED", total: 1, cards: [card("c", "CONTACTED")] },
    { stage: "VISIT_SCHEDULED", total: 0, cards: [] },
    { stage: "PROPOSAL_SENT", total: 0, cards: [] },
    { stage: "CLOSED_WON", total: 0, cards: [] },
    { stage: "CLOSED_LOST", total: 0, cards: [] },
  ],
}

afterEach(() => vi.clearAllMocks())

describe("resolveDrop", () => {
  it("suelta sobre una columna vacía o sobre el final", () => {
    expect(resolveDrop(pipeline, "a", "column:VISIT_SCHEDULED")).toEqual({
      stage: "VISIT_SCHEDULED",
      index: 0,
    })
    expect(resolveDrop(pipeline, "a", "column:CONTACTED")).toEqual({
      stage: "CONTACTED",
      index: 1,
    })
  })

  it("suelta sobre una tarjeta de otra columna: va antes", () => {
    expect(resolveDrop(pipeline, "a", "c")).toEqual({
      stage: "CONTACTED",
      index: 0,
    })
  })

  it("dentro de la misma columna hacia abajo va después", () => {
    expect(resolveDrop(pipeline, "a", "b")).toEqual({ stage: "NEW", index: 1 })
    expect(resolveDrop(pipeline, "b", "a")).toEqual({ stage: "NEW", index: 0 })
  })

  it("destino desconocido", () => {
    expect(resolveDrop(pipeline, "a", "zzz")).toBeNull()
  })
})

describe("formularios", () => {
  it("la carga manual exige nombre y un medio de contacto", () => {
    const base = {
      name: "Luz",
      email: "",
      phone: "",
      message: "",
      propertyId: null,
      source: "PHONE" as const,
      assignedToId: "none",
    }
    expect(buildCreateRequest(base)).toBeNull()
    expect(
      buildCreateRequest({ ...base, phone: " 1122 ", message: "Hola" })
    ).toEqual({
      name: "Luz",
      source: "PHONE",
      phone: "1122",
      message: "Hola",
    })
    expect(buildCreateRequest({ ...base, name: " ", phone: "1" })).toBeNull()
  })

  it("el motivo «Otro» usa el texto libre", () => {
    expect(lostReasonValue("Precio", "x")).toBe("Precio")
    expect(lostReasonValue("Otro", "  Se mudó ")).toBe("Se mudó")
    expect(lostReasonValue("Otro", " ")).toBe("")
  })

  it("no envía una consulta sin contacto y avisa", async () => {
    const user = userEvent.setup()
    render(<NewInquiryDialog open onOpenChange={vi.fn()} />)
    await user.type(await screen.findByLabelText("Nombre"), "Luz")
    await user.click(screen.getByRole("button", { name: "Cargar consulta" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "al menos un teléfono o un email"
    )
    expect(create).not.toHaveBeenCalled()
  })

  it("envía la consulta cargada a mano", async () => {
    create.mockResolvedValue({})
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(<NewInquiryDialog open onOpenChange={onOpenChange} />)
    await user.type(await screen.findByLabelText("Nombre"), "Luz")
    await user.type(screen.getByLabelText("Teléfono"), "1122334455")
    await user.click(screen.getByRole("button", { name: "Cargar consulta" }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: "Luz",
        phone: "1122334455",
        source: "WHATSAPP",
      })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe("tarjeta", () => {
  it("muestra propiedad, 'Consulta general' y seguimiento vencido", () => {
    render(
      <InquiryCardView
        card={card("a", "NEW", { nextActionAt: "2000-01-01" })}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText("Consulta general")).toBeInTheDocument()
    expect(screen.getByText("Seguimiento vencido")).toBeInTheDocument()
    expect(screen.getByText("Hace 3 h")).toBeInTheDocument()
  })

  it("sin WhatsApp no ofrece el botón", () => {
    render(
      <InquiryCardView
        card={card("a", "NEW", { hasWhatsApp: false })}
        onOpen={vi.fn()}
      />
    )
    expect(screen.queryByRole("button", { name: /WhatsApp/ })).toBeNull()
  })

  it("WhatsApp pide el link y registra el intento", async () => {
    whatsapp.mockResolvedValue({ url: "https://wa.me/549", message: "Hola" })
    attempt.mockResolvedValue({})
    const tab = { location: { href: "" }, close: vi.fn(), opener: {} }
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window)
    const user = userEvent.setup()
    render(<InquiryCardView card={card("a", "NEW")} onOpen={vi.fn()} />)
    await user.click(
      screen.getByRole("button", { name: "WhatsApp a Cliente a" })
    )
    await waitFor(() =>
      expect(attempt).toHaveBeenCalledWith({ id: "a", channel: "WHATSAPP" })
    )
    expect(whatsapp).toHaveBeenCalledWith("a", undefined)
    expect(tab.location.href).toBe("https://wa.me/549")
  })

  it("sin teléfono válido cierra la pestaña y no registra nada", async () => {
    whatsapp.mockResolvedValue({ url: null, message: "" })
    const tab = { location: { href: "" }, close: vi.fn(), opener: {} }
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window)
    const user = userEvent.setup()
    render(<InquiryCardView card={card("a", "NEW")} onOpen={vi.fn()} />)
    await user.click(
      screen.getByRole("button", { name: "WhatsApp a Cliente a" })
    )
    await waitFor(() => expect(tab.close).toHaveBeenCalled())
    expect(attempt).not.toHaveBeenCalled()
  })
})

describe("vista mobile", () => {
  it("pestañas con contadores y selector «Mover a…»", async () => {
    const onMove = vi.fn()
    const user = userEvent.setup()
    render(
      <StageTabs
        pipeline={pipeline}
        filters={{}}
        onOpen={vi.fn()}
        onMove={onMove}
      />
    )
    expect(screen.getByRole("tab", { name: /Nueva/ })).toHaveTextContent("2")
    expect(screen.getByText("Cliente a")).toBeInTheDocument()
    await user.click(
      screen.getByRole("combobox", { name: /Mover a… \(Cliente a\)/ })
    )
    await user.click(await screen.findByRole("option", { name: "Contactada" }))
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
      "CONTACTED",
      pipeline.columns[1]!.cards,
      1
    )
  })
})
