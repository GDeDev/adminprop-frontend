import type { Metadata } from "next"

import { AdminGate } from "./admin-gate"
import { SiteScreen } from "./site-screen"

export const metadata: Metadata = { title: "Mi sitio web" }

export default function Page() {
  return (
    <AdminGate>
      <SiteScreen />
    </AdminGate>
  )
}
