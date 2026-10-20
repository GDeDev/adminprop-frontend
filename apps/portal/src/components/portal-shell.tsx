"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import type { PortalRole } from "@adminprop/shared-types"
import { AppSidebar } from "@adminprop/ui/components/app-sidebar"
import { BottomNav } from "@adminprop/ui/components/bottom-nav"
import { Button } from "@adminprop/ui/components/button"
import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"

import { portalNav } from "@/lib/navigation"
import { PORTAL_AREAS } from "@/lib/session"

/** Slot de marca: nombre de la inmobiliaria del portal. */
function BrandMark({
  tenantName,
  areaLabel,
}: {
  tenantName: string | null
  areaLabel: string
}) {
  return (
    <Link href="/" className="flex min-w-0 flex-col">
      <span className="truncate font-display text-xl font-semibold tracking-tight">
        {tenantName ?? "Adminprop"}
      </span>
      <span className="text-xs text-sidebar-muted">{areaLabel}</span>
    </Link>
  )
}

function SignOutButton({
  role,
  className,
}: {
  role: PortalRole
  className?: string
}) {
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
        void signOut(PORTAL_AREAS[role].loginPath)
      }}
    >
      <LogOut aria-hidden />
    </Button>
  )
}

/**
 * Layout de las secciones logueadas del portal, mismo patrón que el
 * backoffice: barra superior + `BottomNav` en mobile, `AppSidebar` desde `md:`.
 */
export function PortalShell({
  role,
  tenantName,
  children,
}: {
  role: PortalRole
  tenantName: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user } = useSession()
  const { areaLabel, items } = portalNav[role]
  const navLabel = `Portal de ${areaLabel.toLowerCase()}`
  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email

  return (
    <div className="min-h-svh md:flex">
      <AppSidebar
        items={items}
        pathname={pathname}
        linkComponent={Link}
        aria-label={navLabel}
        header={<BrandMark tenantName={tenantName} areaLabel={areaLabel} />}
        footer={
          <div className="flex flex-col gap-3">
            {userName && (
              <div className="flex items-center justify-between gap-2 px-3">
                <p className="min-w-0 truncate text-sm font-medium">
                  {userName}
                </p>
                <SignOutButton
                  role={role}
                  className="shrink-0 text-sidebar-foreground hover:bg-sidebar-border/60 focus-visible:ring-accent"
                />
              </div>
            )}
            <div className="flex items-center justify-between px-3 text-sm text-sidebar-muted">
              Tema
              <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-border/60 focus-visible:ring-accent" />
            </div>
          </div>
        }
      />

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <Link
            href="/"
            className="min-w-0 truncate font-display text-xl font-semibold tracking-tight"
          >
            {tenantName ?? "Adminprop"}
          </Link>
          <div className="flex shrink-0 items-center">
            <ThemeToggle className="hover:bg-muted" />
            <SignOutButton role={role} className="hover:bg-muted" />
          </div>
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
