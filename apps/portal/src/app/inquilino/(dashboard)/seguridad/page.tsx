import type { Metadata } from "next"

import { PortalSecurityScreen } from "@/components/portal-security-screen"

export const metadata: Metadata = { title: "Seguridad" }

export default function Page() {
  return <PortalSecurityScreen role="renter" />
}
