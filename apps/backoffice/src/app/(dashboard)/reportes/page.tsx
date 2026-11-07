import type { Metadata } from "next"

import { ReportsScreen } from "./reports-screen"

export const metadata: Metadata = { title: "Reportes" }

export default function Page() {
  return <ReportsScreen />
}
