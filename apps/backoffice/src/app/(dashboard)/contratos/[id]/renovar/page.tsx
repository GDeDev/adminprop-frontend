import type { Metadata } from "next"

import { RenewContract } from "./renew-contract"

export const metadata: Metadata = { title: "Renovar contrato" }

export default async function Page({
  params,
}: PageProps<"/contratos/[id]/renovar">) {
  const { id } = await params
  return <RenewContract id={id} />
}
