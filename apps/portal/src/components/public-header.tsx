import Link from "next/link"

/** Header del sitio público. El nombre/logo es slot de marca del tenant. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 bg-nav pt-[env(safe-area-inset-top)] text-nav-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-tight"
        >
          Adminprop
        </Link>
        <nav className="flex items-center gap-4 text-sm text-nav-muted">
          <Link href="/propietario/login" className="hover:text-nav-foreground">
            Propietarios
          </Link>
          <Link href="/inquilino/login" className="hover:text-nav-foreground">
            Inquilinos
          </Link>
        </nav>
      </div>
    </header>
  )
}
