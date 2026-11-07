import * as React from "react"
import type { Metadata } from "next"

import { AuditScreen } from "./audit-screen"

export const metadata: Metadata = { title: "Auditoría" }

export default function Page() {
  return (
    <React.Suspense>
      <AuditScreen />
    </React.Suspense>
  )
}
