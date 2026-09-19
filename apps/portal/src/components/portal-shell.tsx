"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import type { PortalRole } from "@adminprop/shared-types"
import { AppSidebar } from "@adminprop/ui/components/app-sidebar"
import { BottomNav } from "@adminprop/ui/components/bottom-nav"
import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"

import { portalNav } from "@/lib/navigation"

/** Slot de marca: se reemplaza por el logo/nombre del tenant. */
function BrandMark({ areaLabel }: { areaLabel: string }) {
  return (
    <Link href="/" className="flex flex-col">
      <span className="font-display text-xl font-semibold tracking-tight">
        Adminprop
      </span>
      <span className="text-xs text-sidebar-muted">{areaLabel}</span>
    </Link>
  )
}

/**
 * Layout de las secciones logueadas del portal, mismo patrón que el
 * backoffice: barra superior + `BottomNav` en mobile, `AppSidebar` desde `md:`.
 */
export function PortalShell({
  role,
  children,
}: {
  role: PortalRole
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { areaLabel, items } = portalNav[role]
  const navLabel = `Portal de ${areaLabel.toLowerCase()}`

  return (
    <div className="min-h-svh md:flex">
      <AppSidebar
        items={items}
        pathname={pathname}
        linkComponent={Link}
        aria-label={navLabel}
        header={<BrandMark areaLabel={areaLabel} />}
        footer={
          <div className="flex items-center justify-between px-3 text-sm text-sidebar-muted">
            Tema
            <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-border/60 focus-visible:ring-accent" />
          </div>
        }
      />

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight"
          >
            Adminprop
          </Link>
          <ThemeToggle className="hover:bg-muted" />
        </header>

        {/* pb-28: que la BottomNav no tape el final del contenido en mobile. */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav
        items={items}
        pathname={pathname}
        linkComponent={Link}
        aria-label={navLabel}
      />
    </div>
  )
}
