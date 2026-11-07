import type { Metadata } from "next"

import { AutomationsScreen } from "./automations-screen"

export const metadata: Metadata = { title: "Automatizaciones" }

export default function Page() {
  return <AutomationsScreen />
}
