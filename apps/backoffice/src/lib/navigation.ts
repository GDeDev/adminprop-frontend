import {
  Building2,
  FileText,
  KeyRound,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react"

import type { NavItem } from "@adminprop/ui/lib/navigation"

/** Todas las secciones, en el orden del sidebar de desktop. */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/propietarios", label: "Propietarios", icon: KeyRound },
  { href: "/inquilinos", label: "Inquilinos", icon: Users },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/cobros", label: "Cobros", icon: Wallet },
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
