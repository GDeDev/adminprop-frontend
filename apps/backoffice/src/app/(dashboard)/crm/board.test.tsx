import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Board, dragAnnouncements } from "./board"
import { makeCard, makePipeline } from "@/test-utils/crm-fixtures"

const fetchNextPage = vi.fn()
const refetch = vi.fn()
// Lo que devuelve «ver más» sólo para la columna Nueva; el resto queda inerte.
let more: Record<string, unknown> = {}
const useInfiniteInquiries = vi.fn<
  (filters: { stage?: string }, enabled?: boolean) => unknown
>((filters) => (filters.stage === "NEW" ? more : idleDef))

vi.mock("@/lib/crm-api", () => ({
  useInfiniteInquiries: (filters: { stage?: string }, enabled?: boolean) =>
    useInfiniteInquiries(filters, enabled),
  useContactAttempt: () => ({ mutateAsync: vi.fn() }),
  fetchWhatsAppLink: vi.fn(),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const idleDef = {
  data: undefined,
  hasNextPage: false,
  isFetching: false,
  isError: false,
  fetchNextPage,
  refetch,
}

afterEach(() => {
  vi.clearAllMocks()
  more = idleDef
})

function column(name: string) {
  return screen.getByRole("region", { name: new RegExp(`^${name}`) })
}

describe("Board", () => {
  it("muestra las seis columnas con su total, aun las vacías", () => {
    more = idleDef
    render(
      <Board
        pipeline={makePipeline({ NEW: [makeCard("a", "NEW")] })}
        filters={{}}
        onOpen={vi.fn()}
        onMove={vi.fn()}
      />
    )
    expect(screen.getAllByRole("region")).toHaveLength(6)
    expect(within(column("Nueva")).getByText("Cliente a")).toBeInTheDocument()
    expect(within(column("Nueva")).getByText("1")).toBeInTheDocument()
    expect(
      within(column("Perdida")).getByText("Sin consultas")
    ).toBeInTheDocument()
  })

  it("«Ver más» sólo aparece si hay más tarjetas que las cargadas y pide la etapa con los filtros", async () => {
    more = idleDef
    const user = userEvent.setup()
    render(
      <Board
        pipeline={makePipeline(
          { NEW: [makeCard("a", "NEW")] },
          { NEW: 70, CONTACTED: 0 }
        )}
        filters={{ source: "PORTAL" }}
        onOpen={vi.fn()}
        onMove={vi.fn()}
      />
    )
    expect(screen.getAllByRole("button", { name: "Ver más" })).toHaveLength(1)
    // Antes de pedir más, la consulta paginada está apagada.
    expect(useInfiniteInquiries).toHaveBeenCalledWith(
      { source: "PORTAL", stage: "NEW" },
      false
    )
    await user.click(
      within(column("Nueva")).getByRole("button", { name: "Ver más" })
    )
    expect(useInfiniteInquiries).toHaveBeenCalledWith(
      { source: "PORTAL", stage: "NEW" },
      true
    )
  })

  it("agrega las tarjetas de «Ver más» sin repetir las que ya estaban", async () => {
    const user = userEvent.setup()
    more = idleDef
    const { rerender } = render(
      <Board
        pipeline={makePipeline({ NEW: [makeCard("a", "NEW")] }, { NEW: 3 })}
        filters={{}}
        onOpen={vi.fn()}
        onMove={vi.fn()}
      />
    )
    await user.click(screen.getByRole("button", { name: "Ver más" }))
    more = {
      ...idleDef,
      data: {
        pages: [{ data: [makeCard("a", "NEW"), makeCard("b", "NEW")] }],
      },
      hasNextPage: true,
    }
    rerender(
      <Board
        pipeline={makePipeline({ NEW: [makeCard("a", "NEW")] }, { NEW: 3 })}
        filters={{}}
        onOpen={vi.fn()}
        onMove={vi.fn()}
      />
    )
    expect(screen.getAllByText("Cliente a")).toHaveLength(1)
    expect(screen.getByText("Cliente b")).toBeInTheDocument()
    // Quedan páginas: el botón sigue y pide la siguiente.
    await user.click(screen.getByRole("button", { name: "Ver más" }))
    expect(fetchNextPage).toHaveBeenCalled()
  })

  it("si falla «Ver más» avisa en español y deja reintentar", async () => {
    const user = userEvent.setup()
    more = { ...idleDef, isError: true }
    render(
      <Board
        pipeline={makePipeline({ NEW: [makeCard("a", "NEW")] }, { NEW: 70 })}
        filters={{}}
        onOpen={vi.fn()}
        onMove={vi.fn()}
      />
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudieron cargar más consultas."
    )
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("alternativa al arrastre: el menú «Mover a…» manda la tarjeta al final de la etapa elegida", async () => {
    more = idleDef
    const onMove = vi.fn()
    const pipeline = makePipeline({
      NEW: [makeCard("a", "NEW")],
      CONTACTED: [makeCard("c", "CONTACTED"), makeCard("d", "CONTACTED")],
    })
    const user = userEvent.setup()
    render(
      <Board
        pipeline={pipeline}
        filters={{}}
        onOpen={vi.fn()}
        onMove={onMove}
      />
    )
    await user.click(
      screen.getByRole("button", { name: "Mover a… (Cliente a)" })
    )
    // No ofrece la etapa en la que ya está.
    expect(screen.queryByRole("menuitem", { name: "Nueva" })).toBeNull()
    await user.click(
      await screen.findByRole("menuitem", { name: "Contactada" })
    )
    expect(onMove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a" }),
      "CONTACTED",
      pipeline.columns[1]!.cards,
      2
    )
  })

  it("el menú se maneja con teclado", async () => {
    more = idleDef
    const onMove = vi.fn()
    const user = userEvent.setup()
    render(
      <Board
        pipeline={makePipeline({ NEW: [makeCard("a", "NEW")] })}
        filters={{}}
        onOpen={vi.fn()}
        onMove={onMove}
      />
    )
    screen.getByRole("button", { name: "Mover a… (Cliente a)" }).focus()
    await user.keyboard("{Enter}")
    // Abierto con el teclado, el foco cae en la primera etapa disponible.
    await user.keyboard("{Enter}")
    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove.mock.calls[0]![1]).toBe("CONTACTED")
  })

  it("cada tarjeta tiene un control de arrastre con nombre y un lector de pantalla sabe usarlo", () => {
    more = idleDef
    render(
      <Board
        pipeline={makePipeline({ NEW: [makeCard("a", "NEW")] })}
        filters={{}}
        onOpen={vi.fn()}
        onMove={vi.fn()}
      />
    )
    const handle = screen.getByRole("button", {
      name: "Mover la consulta de Cliente a",
    })
    expect(handle).toHaveAttribute("aria-roledescription", "consulta movible")
    expect(handle).toHaveAttribute("tabindex", "0")
  })

  it("abrir una tarjeta avisa su id", async () => {
    more = idleDef
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(
      <Board
        pipeline={makePipeline({ NEW: [makeCard("a", "NEW")] })}
        filters={{}}
        onOpen={onOpen}
        onMove={vi.fn()}
      />
    )
    await user.click(screen.getByText("Cliente a"))
    expect(onOpen).toHaveBeenCalledWith("a")
  })
})

describe("dragAnnouncements", () => {
  const pipeline = makePipeline({
    NEW: [makeCard("a", "NEW")],
    CONTACTED: [makeCard("c", "CONTACTED")],
  })
  const announcements = dragAnnouncements(pipeline)
  const ref = (id: string) => ({ id }) as never

  it("avisa en español qué consulta se toma, sobre qué está y dónde se suelta", () => {
    expect(announcements.onDragStart!({ active: ref("a") })).toBe(
      "Tomaste la consulta de Cliente a."
    )
    expect(
      announcements.onDragOver!({
        active: ref("a"),
        over: ref("column:CLOSED_WON"),
      })
    ).toBe("La consulta de Cliente a está sobre la etapa «Ganada».")
    expect(announcements.onDragEnd!({ active: ref("a"), over: ref("c") })).toBe(
      "Soltaste la consulta de Cliente a en la etapa «Contactada», junto a Cliente c."
    )
  })

  it("soltar afuera o cancelar dice que no se movió", () => {
    expect(announcements.onDragEnd!({ active: ref("a"), over: null })).toMatch(
      /no se movió/
    )
    expect(
      announcements.onDragCancel!({ active: ref("a"), over: null })
    ).toMatch(/canceló/)
  })
})
