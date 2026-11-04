import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  InquiryCard,
  InquiryStage,
  PipelineDto,
} from "@adminprop/shared-types"

import { Board, moveToStage } from "./board"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/lib/crm-api", () => ({
  useContactAttempt: () => ({ mutateAsync: vi.fn() }),
  fetchWhatsAppLink: vi.fn(),
  useInfiniteInquiries: () => ({
    data: undefined,
    hasNextPage: false,
    isFetching: false,
    fetchNextPage: vi.fn(),
  }),
}))

function card(id: string, stage: InquiryStage): InquiryCard {
  return {
    id,
    name: `Cliente ${id}`,
    email: null,
    phone: "1",
    message: "",
    stage,
    boardPosition: 1,
    source: "PORTAL",
    property: null,
    assignedTo: null,
    nextActionAt: null,
    lastContactAt: null,
    createdAt: "2026-11-01T10:00:00Z",
    ageHours: 2,
    hasWhatsApp: false,
  }
}

const pipeline: PipelineDto = {
  columns: [
    { stage: "NEW", total: 1, cards: [card("a", "NEW")] },
    { stage: "CONTACTED", total: 1, cards: [card("c", "CONTACTED")] },
    { stage: "VISIT_SCHEDULED", total: 0, cards: [] },
    { stage: "PROPOSAL_SENT", total: 0, cards: [] },
    { stage: "CLOSED_WON", total: 0, cards: [] },
    // Total mayor que las tarjetas cargadas: hay "Ver más".
    { stage: "CLOSED_LOST", total: 60, cards: [card("z", "CLOSED_LOST")] },
  ],
}

afterEach(() => vi.clearAllMocks())

describe("moveToStage", () => {
  it("manda la tarjeta al final de la etapa elegida", () => {
    const onMove = vi.fn()
    moveToStage(pipeline, card("a", "NEW"), "CONTACTED", onMove)
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
      "CONTACTED",
      pipeline.columns[1]!.cards,
      1
    )
  })

  it("a una columna vacía va en el lugar 0", () => {
    const onMove = vi.fn()
    moveToStage(pipeline, card("a", "NEW"), "VISIT_SCHEDULED", onMove)
    expect(onMove).toHaveBeenCalledWith(
      expect.anything(),
      "VISIT_SCHEDULED",
      [],
      0
    )
  })

  it("la misma etapa no hace nada", () => {
    const onMove = vi.fn()
    moveToStage(pipeline, card("a", "NEW"), "NEW", onMove)
    expect(onMove).not.toHaveBeenCalled()
  })
})

describe("Board", () => {
  it("muestra las seis columnas con su total y 'Sin consultas' si están vacías", () => {
    render(
      <Board
        pipeline={pipeline}
        filters={{}}
        onOpen={vi.fn()}
        onMove={vi.fn()}
      />
    )
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6)
    const lost = screen.getByRole("region", { name: /Perdida/ })
    expect(within(lost).getByText("60")).toBeInTheDocument()
    expect(within(lost).getByRole("button", { name: "Ver más" })).toBeVisible()
    expect(screen.getAllByText("Sin consultas")).toHaveLength(3)
  })

  it("ofrece el asa de arrastre y el menú «Mover a…» sin mouse", async () => {
    const onMove = vi.fn()
    const user = userEvent.setup()
    render(
      <Board
        pipeline={pipeline}
        filters={{}}
        onOpen={vi.fn()}
        onMove={onMove}
      />
    )
    expect(
      screen.getByRole("button", { name: "Mover la consulta de Cliente a" })
    ).toBeInTheDocument()
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
