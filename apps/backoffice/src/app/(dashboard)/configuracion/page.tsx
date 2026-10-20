import type { Metadata } from "next"

import { SettingsIndex } from "./settings-index"

export const metadata: Metadata = { title: "Configuración" }

export default function Page() {
  return <SettingsIndex />
}
