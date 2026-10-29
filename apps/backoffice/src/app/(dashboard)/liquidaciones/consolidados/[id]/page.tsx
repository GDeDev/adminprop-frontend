import type { Metadata } from "next"

import { StatementDetailScreen } from "./statement-detail"

export const metadata: Metadata = { title: "Consolidado" }

export default async function Page({
  params,
}: PageProps<"/liquidaciones/consolidados/[id]">) {
  const { id } = await params
  return <StatementDetailScreen id={id} />
}
