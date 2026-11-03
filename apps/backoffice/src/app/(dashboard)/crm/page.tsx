import type { Metadata } from "next"

import { CrmScreen } from "./crm-screen"

export const metadata: Metadata = { title: "Consultas" }

export default function Page() {
  return <CrmScreen />
}
