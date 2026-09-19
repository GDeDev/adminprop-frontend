"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@adminprop/ui/components/app-sidebar"
import { BottomNav } from "@adminprop/ui/components/bottom-nav"
import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"

import { mobileMoreItems, mobileNavItems, navItems } from "@/lib/navigation"

/** Slot de marca: se reemplaza por el logo/nombre del tenant (Fase 4). */
function BrandMark() {
  return (
    <Link
      href="/dashboard"
      className="font-display text-xl font-semibold tracking-tight"
    >
      Adminprop
    </Link>
  )
}

/**
 * Layout de las pantallas logueadas, mobile primero: barra superior +
 * `BottomNav` en mobile; `AppSidebar` desde `md:`.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-svh md:flex">
      <AppSidebar
        items={navItems}
        pathname={pathname}
        linkComponent={Link}
        header={<BrandMark />}
        footer={
          <div className="flex items-center justify-between px-3 text-sm text-sidebar-muted">
            Tema
            <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-border/60 focus-visible:ring-accent" />
          </div>
        }
      />

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <BrandMark />
          <ThemeToggle className="hover:bg-muted" />
        </header>

        {/* pb-28: que la BottomNav no tape el final del contenido en mobile. */}
        <main className="flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav
        items={mobileNavItems}
        more={{ items: mobileMoreItems }}
        pathname={pathname}
        linkComponent={Link}
      />
    </div>
  )
}
