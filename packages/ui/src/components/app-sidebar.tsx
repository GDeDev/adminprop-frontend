import * as React from "react"
import { cn } from "cn"

import {
  isActivePath,
  type NavItem,
  type NavLinkComponent,
} from "@adminprop/ui/lib/navigation"

/**
 * Sidebar de desktop (ADMINPROP-UI.md, "Componentes propios"): 248px, chrome
 * oscuro con los tokens `sidebar*` en los dos modos. Se muestra desde `md:`;
 * en mobile la navegación es `BottomNav`.
 */
function AppSidebar({
  items,
  pathname,
  linkComponent: Link = "a",
  header,
  footer,
  className,
  "aria-label": ariaLabel = "Navegación principal",
}: {
  items: NavItem[]
  /** Ruta actual (`usePathname()` en las apps). */
  pathname: string
  linkComponent?: NavLinkComponent
  /** Arriba: logo o nombre de la inmobiliaria. */
  header?: React.ReactNode
  /** Abajo: usuario, tema, cerrar sesión. */
  footer?: React.ReactNode
  className?: string
  "aria-label"?: string
}) {
  return (
    <aside
      data-slot="app-sidebar"
      className={cn(
        // w-62 = 248px
        "sticky top-0 hidden h-svh w-62 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        className
      )}
    >
      {header && <div className="px-5 pt-6 pb-4">{header}</div>}
      <nav
        aria-label={ariaLabel}
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2"
      >
        {items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              data-active={active}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-muted transition-colors outline-none hover:bg-sidebar-border/60 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-accent",
                active && "bg-sidebar-border text-sidebar-foreground"
              )}
            >
              <Icon
                aria-hidden
                className={cn("size-4 shrink-0", active && "text-accent")}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {footer && (
        <div className="border-t border-sidebar-border px-3 py-4">{footer}</div>
      )}
    </aside>
  )
}

export { AppSidebar }
