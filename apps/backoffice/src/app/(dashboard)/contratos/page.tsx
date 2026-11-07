import type { Metadata } from "next"

import { ContractList } from "./contract-list"

export const metadata: Metadata = { title: "Contratos" }

export default function Page() {
  return <ContractList />
}
