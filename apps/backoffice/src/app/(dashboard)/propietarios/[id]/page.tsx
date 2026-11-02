import type { Metadata } from "next"

import { EntityHistory } from "@/components/entity-history"

import { OwnerDetailScreen } from "./owner-detail"

export const metadata: Metadata = { title: "Propietario" }

export default async function Page({
  params,
}: PageProps<"/propietarios/[id]">) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6">
      <OwnerDetailScreen id={id} />
      <EntityHistory entity="Owner" entityId={id} />
    </div>
  )
}
