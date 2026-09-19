"use client"

import * as React from "react"
import { cn } from "cn"
import { MoreHorizontal } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@adminprop/ui/components/drawer"
import {
  isActivePath,
  type NavItem,
  type NavLinkComponent,
} from "@adminprop/ui/lib/navigation"

/** Cinco destinos como máximo en la barra, contando "Más". */
const MAX_DESTINATIONS = 5

const itemClassName =
  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.7rem] leading-none font-medium text-sidebar-muted outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset data-[active=true]:text-sidebar-foreground"

/**
 * Navegación mobile (ADMINPROP-UI.md, "Componentes propios"): hasta cinco
 * destinos, fondo `sidebar`, el activo marcado con `accent`. Se oculta desde
 * `md:`, donde aparece `AppSidebar`.
 *
 * Si hay más secciones, van en `more`: la barra muestra un botón "Más" que
 * abre un Drawer con el resto (mobile = Drawer).
 */
function BottomNav({
  items,
  more,
  pathname,
  linkComponent: Link = "a",
  className,
  "aria-label": ariaLabel = "Navegación principal",
}: {
  items: NavItem[]
  more?: { label?: string; title?: string; items: NavItem[] }
  /** Ruta actual (`usePathname()` en las apps). */
  pathname: string
  linkComponent?: NavLinkComponent
  className?: string
  "aria-label"?: string
}) {
  const slots = items.length + (more ? 1 : 0)
  if (process.env.NODE_ENV !== "production" && slots > MAX_DESTINATIONS) {
    console.warn(
      `BottomNav: ${slots} destinos; el máximo es ${MAX_DESTINATIONS}. Pasá el resto en "more".`
    )
  }

  return (
    <nav
      data-slot="bottom-nav"
      aria-label={ariaLabel}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 grid border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}
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
            className={itemClassName}
          >
            <Icon
              aria-hidden
              className={cn("size-5", active && "text-accent")}
            />
            {item.label}
          </Link>
        )
      })}
      {more && (
        <MoreDrawer {...more} pathname={pathname} linkComponent={Link} />
      )}
    </nav>
  )
}

function MoreDrawer({
  label = "Más",
  title = "Más secciones",
  items,
  pathname,
  linkComponent: Link,
}: {
  label?: string
  title?: string
  items: NavItem[]
  pathname: string
  linkComponent: NavLinkComponent
}) {
  const [open, setOpen] = React.useState(false)
  const active = items.some((item) => isActivePath(pathname, item.href))

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger data-active={active} className={itemClassName}>
        <MoreHorizontal
          aria-hidden
          className={cn("size-5", active && "text-accent")}
        />
        {label}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Secciones que no entran en la barra inferior.
          </DrawerDescription>
        </DrawerHeader>
        <nav aria-label={title} className="grid gap-1 px-4 pb-6">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-base font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "bg-muted"
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "size-5 text-muted-foreground",
                    isActive && "text-accent"
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}

export { BottomNav }
