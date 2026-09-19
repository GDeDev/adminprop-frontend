import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Building2,
  FileText,
  Home,
  Settings,
  Users,
  Wallet,
} from "lucide-react"
import { describe, expect, it } from "vitest"

import type { NavItem } from "../lib/navigation"
import { AppSidebar } from "./app-sidebar"
import { BottomNav } from "./bottom-nav"

const items: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/cobros", label: "Cobros", icon: Wallet },
]

const moreItems: NavItem[] = [
  { href: "/inquilinos", label: "Inquilinos", icon: Users },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

describe("AppSidebar", () => {
  it("marca la sección actual con aria-current y usa el chrome sidebar", () => {
    render(
      <AppSidebar
        items={items}
        pathname="/propiedades/123"
        header={<span>Inmobiliaria Demo</span>}
      />
    )

    const nav = screen.getByRole("navigation", { name: "Navegación principal" })
    const current = within(nav).getByRole("link", { name: "Propiedades" })
    expect(current).toHaveAttribute("aria-current", "page")
    expect(current).toHaveAttribute("href", "/propiedades")
    expect(
      within(nav).getByRole("link", { name: "Inicio" })
    ).not.toHaveAttribute("aria-current")
    expect(screen.getByText("Inmobiliaria Demo")).toBeInTheDocument()

    const aside = nav.closest("aside")
    expect(aside).toHaveClass("bg-sidebar", "w-62", "hidden", "md:flex")
  })

  it("usa el componente de link que le pasan", () => {
    function FakeLink(props: React.ComponentProps<"a">) {
      return <a data-router="fake" {...props} />
    }
    render(<AppSidebar items={items} pathname="/" linkComponent={FakeLink} />)
    expect(screen.getByRole("link", { name: "Cobros" })).toHaveAttribute(
      "data-router",
      "fake"
    )
  })
})

describe("BottomNav", () => {
  it("muestra los destinos y se oculta desde md", () => {
    render(<BottomNav items={items} pathname="/cobros" />)

    const nav = screen.getByRole("navigation", { name: "Navegación principal" })
    expect(nav).toHaveClass("bg-sidebar", "md:hidden")
    expect(within(nav).getAllByRole("link")).toHaveLength(4)
    expect(within(nav).getByRole("link", { name: "Cobros" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("abre un Drawer con las secciones de 'Más'", async () => {
    const user = userEvent.setup()
    render(
      <BottomNav
        items={items}
        more={{ items: moreItems }}
        pathname="/configuracion"
      />
    )

    const trigger = screen.getByRole("button", { name: "Más" })
    // La sección actual está dentro de "Más": el botón queda activo.
    expect(trigger).toHaveAttribute("data-active", "true")

    await user.click(trigger)

    const drawer = await screen.findByRole("dialog")
    expect(
      within(drawer).getByRole("link", { name: "Configuración" })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(drawer).getByRole("link", { name: "Inquilinos" })
    ).toBeInTheDocument()
  })
})
