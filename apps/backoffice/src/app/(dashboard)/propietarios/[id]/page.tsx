import type { Metadata } from "next"

import { OwnerDetailScreen } from "./owner-detail"

export const metadata: Metadata = { title: "Propietario" }

export default async function Page({
  params,
}: PageProps<"/propietarios/[id]">) {
  const { id } = await params
  return <OwnerDetailScreen id={id} />
}
