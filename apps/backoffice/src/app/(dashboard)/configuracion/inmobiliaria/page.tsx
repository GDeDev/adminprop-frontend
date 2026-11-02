import type { Metadata } from "next"

import { AgencySettingsScreen } from "./agency-settings-screen"

export const metadata: Metadata = { title: "Inmobiliaria" }

export default function Page() {
  return <AgencySettingsScreen />
}
