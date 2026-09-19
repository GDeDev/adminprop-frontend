import type * as React from "react"
import type { LucideIcon } from "lucide-react"

/** Un destino de navegación (BottomNav, AppSidebar). */
export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

/**
 * Componente de link que usa la navegación. Las apps pasan `next/link`; así
 * el paquete de UI no depende del router de Next y se puede testear solo.
 */
export type NavLinkComponent = React.ElementType<
  React.ComponentProps<"a"> & { href: string }
>

/** `true` si `pathname` es la sección `href` o una subruta suya. */
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
