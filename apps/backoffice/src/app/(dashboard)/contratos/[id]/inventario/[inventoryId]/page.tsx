import type { Metadata } from "next"

import { InventoryEditor } from "./inventory-editor"

export const metadata: Metadata = { title: "Inventario" }

export default async function Page({
  params,
}: PageProps<"/contratos/[id]/inventario/[inventoryId]">) {
  const { id, inventoryId } = await params
  return <InventoryEditor contractId={id} inventoryId={inventoryId} />
}
