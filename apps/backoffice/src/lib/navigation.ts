import {
  BarChart3,
  Building2,
  FileText,
  Globe,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react"

import type { NavItem } from "@adminprop/ui/lib/navigation"

/** Todas las secciones, en el orden del sidebar de desktop. */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/crm", label: "Consultas", icon: Inbox },
  { href: "/propietarios", label: "Propietarios", icon: KeyRound },
  { href: "/inquilinos", label: "Inquilinos", icon: Users },
  { href: "/garantes", label: "Garantes", icon: ShieldCheck },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/cobros", label: "Cobros", icon: Wallet },
  { href: "/liquidaciones", label: "Liquidaciones", icon: Receipt },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/sitio-web", label: "Mi sitio web", icon: Globe },
  { href: "/configuracion", label: "Configuración", icon: Settings },
]

/** Las que van en la barra inferior mobile (máx. 4 + "Más"). */
const MOBILE_PRIMARY = ["/dashboard", "/propiedades", "/contratos", "/cobros"]

export const mobileNavItems = navItems.filter((item) =>
  MOBILE_PRIMARY.includes(item.href)
)

/** El resto va al Drawer de "Más". */
export const mobileMoreItems = navItems.filter(
  (item) => !MOBILE_PRIMARY.includes(item.href)
)

/** Secciones que sólo ve un administrador. */
const ADMIN_ONLY = ["/sitio-web"]

/** Quita del menú lo que el rol no puede usar. */
export function visibleNavItems(
  items: NavItem[],
  role: string | undefined
): NavItem[] {
  return role === "ADMIN"
    ? items
    : items.filter((item) => !ADMIN_ONLY.includes(item.href))
}
