import type { Metadata } from "next"

import { ContractDetailScreen } from "./contract-detail"

export const metadata: Metadata = { title: "Contrato" }

export default async function Page({ params }: PageProps<"/contratos/[id]">) {
  const { id } = await params
  return <ContractDetailScreen id={id} />
}
