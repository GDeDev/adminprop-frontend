import type { Metadata } from "next"

import { GuarantorDetailScreen } from "./guarantor-detail"

export const metadata: Metadata = { title: "Garante" }

export default async function Page({ params }: PageProps<"/garantes/[id]">) {
  const { id } = await params
  return <GuarantorDetailScreen id={id} />
}
