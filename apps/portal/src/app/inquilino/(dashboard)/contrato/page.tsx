import type { Metadata } from "next"

import { RenterContractScreen } from "./contract-screen"

export const metadata: Metadata = { title: "Mi contrato" }

export default function Page() {
  return <RenterContractScreen />
}
