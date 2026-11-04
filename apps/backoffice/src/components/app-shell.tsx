"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Search, UserRound } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import { AppSidebar } from "@adminprop/ui/components/app-sidebar"
import { BottomNav } from "@adminprop/ui/components/bottom-nav"
import { Button } from "@adminprop/ui/components/button"
import { CommandPalette } from "@adminprop/ui/components/command-palette"
import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"

import { TenantNameProvider } from "./tenant-name"
import {
  mobileMoreItems,
  mobileNavItems,
  navItems,
  visibleNavItems,
} from "@/lib/navigation"
import { displayName, roleLabel } from "@/lib/users"

/** Slot de marca: nombre de la inmobiliaria (o "Adminprop" sin sesión). */
function BrandMark({ tenantName }: { tenantName: string | null }) {
  return (
    <Link
      href="/dashboard"
      className="block truncate font-display text-xl font-semibold tracking-tight"
    >
      {tenantName ?? "Adminprop"}
    </Link>
  )
}

function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useSession()
  const [pending, setPending] = React.useState(false)

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      disabled={pending}
      onClick={() => {
        setPending(true)
        void signOut()
      }}
    >
      <LogOut aria-hidden />
    </Button>
  )
}

/** Pie del sidebar: quién está logueado, tema y salir. */
function AccountFooter({ onSearch }: { onSearch: () => void }) {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onSearch}
        className="mx-3 flex min-h-10 pressable items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-border/40 px-3 text-sm text-sidebar-muted outline-none hover:bg-sidebar-border/70 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Search aria-hidden className="size-4" />
        Buscar
        <kbd className="ml-auto rounded border border-sidebar-border px-1.5 font-mono text-[0.7rem]">
          Ctrl K
        </kbd>
      </button>
      {user && (
        <div className="flex items-center justify-between gap-2 px-3">
          <Link
            href="/perfil"
            className="min-w-0 rounded-md hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label="Mi perfil"
          >
            <p className="truncate text-sm font-medium">{displayName(user)}</p>
            <p className="truncate text-xs text-sidebar-muted">
              {roleLabel(user.role)}
            </p>
          </Link>
          <SignOutButton className="shrink-0 text-sidebar-foreground hover:bg-sidebar-border/60 focus-visible:ring-accent" />
        </div>
      )}
      <div className="flex items-center justify-between px-3 text-sm text-sidebar-muted">
        Tema
        <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-border/60 focus-visible:ring-accent" />
      </div>
    </div>
  )
}

/**
 * Layout de las pantallas logueadas, mobile primero: barra superior +
 * `BottomNav` en mobile; `AppSidebar` desde `md:`.
 */
export function AppShell({
  tenantName,
  children,
}: {
  tenantName: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user } = useSession()
  const role = user?.role
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = React.useState(false)

  return (
    <TenantNameProvider name={tenantName}>
      <div className="min-h-svh md:flex">
        <AppSidebar
          items={visibleNavItems(navItems, role)}
          pathname={pathname}
          linkComponent={Link}
          header={<BrandMark tenantName={tenantName} />}
          footer={<AccountFooter onSearch={() => setPaletteOpen(true)} />}
        />

        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b glass px-4 pt-[env(safe-area-inset-top)] md:hidden">
            <div className="min-w-0">
              <BrandMark tenantName={tenantName} />
            </div>
            <div className="flex shrink-0 items-center">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Buscar"
                title="Buscar"
                onClick={() => setPaletteOpen(true)}
              >
                <Search aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted"
                aria-label="Mi perfil"
                title="Mi perfil"
                asChild
              >
                <Link href="/perfil">
                  <UserRound aria-hidden />
                </Link>
              </Button>
              <ThemeToggle className="hover:bg-muted" />
              <SignOutButton className="hover:bg-muted" />
            </div>
          </header>

          {/* pb-28: que la BottomNav no tape el final del contenido en mobile. */}
          <main className="flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-10">
            {/* key por ruta: la pantalla nueva entra con fade + subida. */}
            <div key={pathname} className="page-enter">
              {children}
            </div>
          </main>
        </div>

        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          groups={[
            {
              heading: "Ir a",
              items: visibleNavItems(navItems, role).map((item) => ({
                id: item.href,
                label: item.label,
                icon: item.icon,
                onSelect: () => router.push(item.href),
              })),
            },
          ]}
        />

        <BottomNav
          items={visibleNavItems(mobileNavItems, role)}
          more={{ items: visibleNavItems(mobileMoreItems, role) }}
          pathname={pathname}
          linkComponent={Link}
        />
      </div>
    </TenantNameProvider>
  )
}
