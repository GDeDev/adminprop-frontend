import {
  Building2,
  FileText,
  History,
  Phone,
  ReceiptText,
  Wallet,
} from "lucide-react"

import type { PortalRole } from "@adminprop/shared-types"
import type { NavItem } from "@adminprop/ui/lib/navigation"

/**
 * Secciones de cada portal (Fase 17 propietarios, Fase 18 inquilinos). Las
 * dos entran enteras en la BottomNav (máx. 5), sin "Más".
 */
export const portalNav: Record<
  PortalRole,
  { areaLabel: string; items: NavItem[] }
> = {
  owner: {
    areaLabel: "Propietarios",
    items: [
      {
        href: "/propietario/propiedades",
        label: "Propiedades",
        icon: Building2,
      },
      { href: "/propietario/cuenta", label: "Cuenta", icon: Wallet },
      {
        href: "/propietario/liquidaciones",
        label: "Liquidaciones",
        icon: ReceiptText,
      },
      { href: "/propietario/pagos", label: "Pagos", icon: History },
      { href: "/propietario/contacto", label: "Contacto", icon: Phone },
    ],
  },
  renter: {
    areaLabel: "Inquilinos",
    items: [
      { href: "/inquilino/cuenta", label: "Cuenta", icon: Wallet },
      { href: "/inquilino/pagos", label: "Pagos", icon: History },
      { href: "/inquilino/contrato", label: "Contrato", icon: FileText },
      { href: "/inquilino/contacto", label: "Contacto", icon: Phone },
    ],
  },
}
