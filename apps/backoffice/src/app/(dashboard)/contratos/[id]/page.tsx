import type { Metadata } from "next"

import { EntityHistory } from "@/components/entity-history"

import { ContractDetailScreen } from "./contract-detail"

export const metadata: Metadata = { title: "Contrato" }

export default async function Page({ params }: PageProps<"/contratos/[id]">) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6">
      <ContractDetailScreen id={id} />
      <EntityHistory entity="Contract" entityId={id} />
    </div>
  )
}
