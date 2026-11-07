import type { Metadata } from "next"

import { EntityHistory } from "@/components/entity-history"

import { RenterDetailScreen } from "./renter-detail"

export const metadata: Metadata = { title: "Inquilino" }

export default async function Page({ params }: PageProps<"/inquilinos/[id]">) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6">
      <RenterDetailScreen id={id} />
      <EntityHistory entity="Renter" entityId={id} />
    </div>
  )
}
