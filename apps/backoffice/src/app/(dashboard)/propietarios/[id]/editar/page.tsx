import type { Metadata } from "next"

import { EditOwner } from "./edit-owner"

export const metadata: Metadata = { title: "Editar propietario" }

export default async function Page({
  params,
}: PageProps<"/propietarios/[id]/editar">) {
  const { id } = await params
  return <EditOwner id={id} />
}
