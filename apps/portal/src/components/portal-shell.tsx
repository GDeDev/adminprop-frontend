"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  FileText,
  History,
  Phone,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import type { PortalRole } from "@adminprop/shared-types"
import { cn } from "@adminprop/ui/lib/utils"

interface PortalNavItem {
  href: string
  label: string
  icon: LucideIcon
}

// Pantallas de Fase 17 (propietarios) y Fase 18 (inquilinos).
const NAV: Record<PortalRole, { areaLabel: string; items: PortalNavItem[] }> = {
  owner: {
    areaLabel: "Propietarios",
    items: [
      {
        href: "/propietario/propiedades",
        label: "Propiedades",
        icon: Building2,
      },
      { href: "/propietario/cuenta", label: "Cuenta", icon: Wallet },
      {
        href: "/propietario/liquidaciones",
        label: "Liquidaciones",
        icon: ReceiptText,
      },
      { href: "/propietario/pagos", label: "Pagos", icon: History },
      { href: "/propietario/contacto", label: "Contacto", icon: Phone },
    ],
  },
  renter: {
    areaLabel: "Inquilinos",
    items: [
      { href: "/inquilino/cuenta", label: "Cuenta", icon: Wallet },
      { href: "/inquilino/pagos", label: "Pagos", icon: History },
      { href: "/inquilino/contrato", label: "Contrato", icon: FileText },
      { href: "/inquilino/contacto", label: "Contacto", icon: Phone },
    ],
  },
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Layout de las secciones logueadas del portal: navegación superior en
 * desktop, barra inferior en mobile (máx. 5 ítems).
 */
export function PortalShell({
  role,
  children,
}: {
  role: PortalRole
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { areaLabel, items } = NAV[role]

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 bg-sidebar pt-[env(safe-area-inset-top)] text-sidebar-foreground">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Adminprop
          </Link>
          <span className="text-sm text-sidebar-muted">{areaLabel}</span>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-muted hover:text-sidebar-foreground",
                    active && "bg-white/10 text-sidebar-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:pb-10">
        {children}
      </main>

      <nav
        aria-label="Navegación del portal"
        className="fixed inset-x-0 bottom-0 z-40 grid h-16 bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-sidebar-muted",
                active && "text-sidebar-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "text-accent")} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
