import type { Metadata } from "next"

import { InstallmentDetailScreen } from "./installment-detail"

export const metadata: Metadata = { title: "Cuota" }

export default async function Page({ params }: PageProps<"/cobros/[id]">) {
  const { id } = await params
  return <InstallmentDetailScreen id={id} />
}
