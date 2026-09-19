import Link from "next/link"

import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"

/** Header del sitio público. El nombre/logo es slot de marca del tenant. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 bg-sidebar pt-[env(safe-area-inset-top)] text-sidebar-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight"
        >
          Adminprop
        </Link>
        <nav className="flex items-center gap-1 text-sm text-sidebar-muted">
          <Link
            href="/propietario/login"
            className="flex min-h-11 items-center rounded-md px-2 outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-accent"
          >
            Propietarios
          </Link>
          <Link
            href="/inquilino/login"
            className="flex min-h-11 items-center rounded-md px-2 outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-accent"
          >
            Inquilinos
          </Link>
          <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-border/60 focus-visible:ring-accent" />
        </nav>
      </div>
    </header>
  )
}
