import type { Metadata } from "next"

import { MigrationScreen } from "./migration-screen"

export const metadata: Metadata = { title: "Migración de datos" }

export default function Page() {
  return <MigrationScreen />
}
