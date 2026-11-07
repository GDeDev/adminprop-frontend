import type { Metadata } from "next"

import { ContractForm } from "../contract-form"

export const metadata: Metadata = { title: "Nuevo contrato" }

export default function Page() {
  return <ContractForm />
}
