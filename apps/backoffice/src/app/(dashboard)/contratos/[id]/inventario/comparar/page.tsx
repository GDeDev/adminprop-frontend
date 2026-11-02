import type { Metadata } from "next"

import { InventoryComparisonScreen } from "./inventory-comparison"

export const metadata: Metadata = { title: "Comparar inventarios" }

export default async function Page({
  params,
}: PageProps<"/contratos/[id]/inventario/comparar">) {
  const { id } = await params
  return <InventoryComparisonScreen contractId={id} />
}
