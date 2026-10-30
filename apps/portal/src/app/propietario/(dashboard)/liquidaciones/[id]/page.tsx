import type { Metadata } from "next"

import { OwnerSettlementDetailScreen } from "./settlement-detail"

export const metadata: Metadata = { title: "Liquidación" }

export default async function Page({
  params,
}: PageProps<"/propietario/liquidaciones/[id]">) {
  const { id } = await params
  return <OwnerSettlementDetailScreen id={id} />
}
