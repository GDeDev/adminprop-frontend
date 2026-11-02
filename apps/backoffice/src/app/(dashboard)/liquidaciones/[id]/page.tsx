import type { Metadata } from "next"

import { EntityHistory } from "@/components/entity-history"

import { SettlementDetailScreen } from "./settlement-detail"

export const metadata: Metadata = { title: "Liquidación" }

export default async function Page({
  params,
}: PageProps<"/liquidaciones/[id]">) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6">
      <SettlementDetailScreen id={id} />
      <EntityHistory entity="Settlement" entityId={id} />
    </div>
  )
}
