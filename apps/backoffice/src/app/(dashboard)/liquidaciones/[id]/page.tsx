import type { Metadata } from "next"

import { SettlementDetailScreen } from "./settlement-detail"

export const metadata: Metadata = { title: "Liquidación" }

export default async function Page({
  params,
}: PageProps<"/liquidaciones/[id]">) {
  const { id } = await params
  return <SettlementDetailScreen id={id} />
}
