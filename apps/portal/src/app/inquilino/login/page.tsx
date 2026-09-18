import type { Metadata } from "next"

import { PortalLoginPage } from "@/components/portal-login-page"

export const metadata: Metadata = { title: "Ingresar" }

export default function LoginPage() {
  return <PortalLoginPage role="renter" />
}
