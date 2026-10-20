import type { Metadata } from "next"

import { RenterDetailScreen } from "./renter-detail"

export const metadata: Metadata = { title: "Inquilino" }

export default async function Page({ params }: PageProps<"/inquilinos/[id]">) {
  const { id } = await params
  return <RenterDetailScreen id={id} />
}
