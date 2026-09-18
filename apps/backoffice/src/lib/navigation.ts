import {
  Building2,
  FileText,
  KeyRound,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Aparece en la barra inferior en mobile; el resto va al sheet "Más". */
  primaryOnMobile: boolean
}

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    primaryOnMobile: true,
  },
  {
    href: "/propiedades",
    label: "Propiedades",
    icon: Building2,
    primaryOnMobile: true,
  },
  {
    href: "/propietarios",
    label: "Propietarios",
    icon: KeyRound,
    primaryOnMobile: false,
  },
  {
    href: "/inquilinos",
    label: "Inquilinos",
    icon: Users,
    primaryOnMobile: false,
  },
  {
    href: "/contratos",
    label: "Contratos",
    icon: FileText,
    primaryOnMobile: true,
  },
  { href: "/cobros", label: "Cobros", icon: Wallet, primaryOnMobile: true },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
    primaryOnMobile: false,
  },
]

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
