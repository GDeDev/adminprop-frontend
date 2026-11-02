import type { Metadata } from "next"

import { AuditScreen } from "./audit-screen"

export const metadata: Metadata = { title: "Auditoría" }

export default function Page() {
  return <AuditScreen />
}
