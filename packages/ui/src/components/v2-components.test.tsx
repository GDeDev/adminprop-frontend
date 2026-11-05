import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Building2 } from "lucide-react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AiBadge, AiSparkle } from "./ai-badge"
import { AnimatedList, AnimatedListItem } from "./animated-list"
import { CommandPalette } from "./command-palette"
import { GradientSurface } from "./gradient-surface"
import { StatCard } from "./stat-card"

function mockReducedMotion(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("AiBadge", () => {
  it("muestra el texto con el destello decorativo", () => {
    const { container } = render(<AiBadge>Sugerido por IA</AiBadge>)
    expect(screen.getByText("Sugerido por IA")).toHaveAttribute(
      "data-variant",
      "ia"
    )
    const sparkle = container.querySelector("[data-slot=ai-sparkle]")
    expect(sparkle).toHaveAttribute("aria-hidden", "true")
  })

  it("dice IA por defecto", () => {
    render(<AiBadge />)
    expect(screen.getByText("IA")).toBeInTheDocument()
  })

  it("el destello solo anima si se pide", () => {
    const { container, rerender } = render(<AiSparkle />)
    expect(container.querySelector("svg")).not.toHaveClass("animate-sparkle")
    rerender(<AiSparkle animated />)
    expect(container.querySelector("svg")).toHaveClass("animate-sparkle")
  })
})

describe("StatCard", () => {
  it("con reduced-motion muestra el valor exacto de entrada", () => {
    mockReducedMotion(true)
    render(
      <StatCard
        label="Cobrado del mes"
        value="$ 1.250.000,00"
        icon={Building2}
        delta={{ label: "+4,2 %", trend: "up" }}
      />
    )
    expect(screen.getAllByText("$ 1.250.000,00").length).toBeGreaterThan(0)
    expect(screen.getByText("+4,2 %")).toBeInTheDocument()
  })

  it("anima de 0 y termina en el string exacto de la API", async () => {
    mockReducedMotion(false)
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
    })
    const { container } = render(
      <StatCard label="Cobrado" value="$ 450.000,00" />
    )
    const visible = () =>
      container.querySelector("[aria-hidden=true]")?.textContent
    // Antes de animar y al terminar, el valor va una sola vez (sin duplicados
    // para el lector de pantalla).
    expect(screen.getAllByText("$ 450.000,00")).toHaveLength(1)

    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    expect(visible()).not.toBe("$ 450.000,00")
    // Mientras anima, el lector de pantalla lee el valor final.
    expect(
      screen.getByText("$ 450.000,00", { selector: ".sr-only" })
    ).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(visible()).toBeUndefined()
    expect(screen.getAllByText("$ 450.000,00")).toHaveLength(1)
  })

  it("con ai marca el valor como estimado por el sistema", () => {
    mockReducedMotion(true)
    const { container } = render(
      <StatCard label="Precio sugerido" value="$ 600.000,00" ai />
    )
    expect(screen.getByText("IA")).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass("ai-border")
  })
})

describe("GradientSurface", () => {
  it("aplica la variante y deja pasar el contenido", () => {
    render(<GradientSurface variant="brand">Hola</GradientSurface>)
    const el = screen.getByText("Hola")
    expect(el).toHaveAttribute("data-variant", "brand")
    expect(el).toHaveClass("bg-primary-gradient")
  })

  it("por defecto es mesh", () => {
    render(<GradientSurface>Hola</GradientSurface>)
    expect(screen.getByText("Hola")).toHaveClass("bg-mesh")
  })
})

describe("AnimatedList", () => {
  it("marca la lista como stagger y respeta el elemento", () => {
    render(
      <AnimatedList aria-label="Propiedades">
        <AnimatedListItem>Uno</AnimatedListItem>
        <AnimatedListItem>Dos</AnimatedListItem>
      </AnimatedList>
    )
    const list = screen.getByRole("list", { name: "Propiedades" })
    expect(list).toHaveClass("stagger")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })
})

describe("CommandPalette", () => {
  const groups = (onSelect: () => void) => [
    {
      heading: "Secciones",
      items: [
        {
          id: "props",
          label: "Propiedades",
          keywords: ["inmuebles"],
          onSelect,
        },
        { id: "cobros", label: "Cobros", onSelect: vi.fn() },
      ],
    },
  ]

  it("se abre con Ctrl+K y ejecuta el ítem elegido", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<CommandPalette groups={groups(onSelect)} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    await user.keyboard("{Control>}k{/Control}")
    expect(await screen.findByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByText("Propiedades"))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("no escucha el atajo si hotkey es false", async () => {
    const user = userEvent.setup()
    render(<CommandPalette groups={groups(vi.fn())} hotkey={false} />)
    await user.keyboard("{Control>}k{/Control}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("filtra por sinónimos (keywords)", async () => {
    const user = userEvent.setup()
    render(
      <CommandPalette groups={groups(vi.fn())} open onOpenChange={vi.fn()} />
    )
    await user.type(screen.getByRole("combobox"), "inmuebles")
    expect(screen.getByText("Propiedades")).toBeInTheDocument()
    expect(screen.queryByText("Cobros")).not.toBeInTheDocument()
  })
})
