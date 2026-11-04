import Link from "next/link"

import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"

import { getTenantBranding } from "@/lib/tenant-branding"

/** Header del sitio público: nombre y logo de la inmobiliaria (slot de marca). */
export async function PublicHeader() {
  const branding = await getTenantBranding()
  const name = branding?.name ?? "Propiedades en alquiler"

  return (
    <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar chrome-glow pt-[env(safe-area-inset-top)] text-sidebar-foreground supports-[backdrop-filter]:bg-sidebar/85 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 py-2.5 font-display text-title-lg font-semibold"
        >
          {branding?.logoUrl && (
            // Logo del tenant: host variable, sin next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt=""
              className="h-8 w-auto max-w-32 shrink-0 object-contain"
            />
          )}
          <span className="truncate">{name}</span>
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
