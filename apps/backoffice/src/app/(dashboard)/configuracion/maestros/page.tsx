import type { Metadata } from "next"

import { MasterDataScreen } from "./master-data-screen"

export const metadata: Metadata = { title: "Maestros" }

export default function Page() {
  return <MasterDataScreen />
}
