import type { Metadata } from "next"

import { EditRenter } from "./edit-renter"

export const metadata: Metadata = { title: "Editar inquilino" }

export default async function Page({
  params,
}: PageProps<"/inquilinos/[id]/editar">) {
  const { id } = await params
  return <EditRenter id={id} />
}
