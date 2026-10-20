import type { Metadata } from "next"

import { EditProperty } from "./edit-property"

export const metadata: Metadata = { title: "Editar propiedad" }

export default async function Page({
  params,
}: PageProps<"/propiedades/[id]/editar">) {
  const { id } = await params
  return <EditProperty id={id} />
}
