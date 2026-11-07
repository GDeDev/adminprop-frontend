import type { Metadata } from "next"

import { EntityHistory } from "@/components/entity-history"

import { InstallmentDetailScreen } from "./installment-detail"

export const metadata: Metadata = { title: "Cuota" }

export default async function Page({ params }: PageProps<"/cobros/[id]">) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6">
      <InstallmentDetailScreen id={id} />
      <EntityHistory entity="Installment" entityId={id} />
    </div>
  )
}
