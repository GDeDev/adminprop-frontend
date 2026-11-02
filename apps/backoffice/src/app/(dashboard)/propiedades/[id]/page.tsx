import type { Metadata } from "next"

import { EntityHistory } from "@/components/entity-history"

import { PropertyDetailScreen } from "./property-detail"

export const metadata: Metadata = { title: "Propiedad" }

export default async function Page({ params }: PageProps<"/propiedades/[id]">) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6">
      <PropertyDetailScreen id={id} />
      <EntityHistory entity="Property" entityId={id} />
    </div>
  )
}
