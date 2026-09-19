import Link from "next/link"

/** Header del sitio público. El nombre/logo es slot de marca del tenant. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 bg-sidebar pt-[env(safe-area-inset-top)] text-sidebar-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight"
        >
          Adminprop
        </Link>
        <nav className="flex items-center gap-4 text-sm text-sidebar-muted">
          <Link
            href="/propietario/login"
            className="hover:text-sidebar-foreground"
          >
            Propietarios
          </Link>
          <Link
            href="/inquilino/login"
            className="hover:text-sidebar-foreground"
          >
            Inquilinos
          </Link>
        </nav>
      </div>
    </header>
  )
}
