"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import { AppSidebar } from "@adminprop/ui/components/app-sidebar"
import { BottomNav } from "@adminprop/ui/components/bottom-nav"
import { Button } from "@adminprop/ui/components/button"
import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"

import { mobileMoreItems, mobileNavItems, navItems } from "@/lib/navigation"
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
function AccountFooter() {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-3">
      {user && (
        <div className="flex items-center justify-between gap-2 px-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName(user)}</p>
            <p className="truncate text-xs text-sidebar-muted">
              {roleLabel(user.role)}
            </p>
          </div>
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

  return (
    <div className="min-h-svh md:flex">
      <AppSidebar
        items={navItems}
        pathname={pathname}
        linkComponent={Link}
        header={<BrandMark tenantName={tenantName} />}
        footer={<AccountFooter />}
      />

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <div className="min-w-0">
            <BrandMark tenantName={tenantName} />
          </div>
          <div className="flex shrink-0 items-center">
            <ThemeToggle className="hover:bg-muted" />
            <SignOutButton className="hover:bg-muted" />
          </div>
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
