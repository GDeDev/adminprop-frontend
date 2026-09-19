import type { Metadata } from "next"

import { PropertyDetailScreen } from "./property-detail"

export const metadata: Metadata = { title: "Propiedad" }

export default async function Page({ params }: PageProps<"/propiedades/[id]">) {
  const { id } = await params
  return <PropertyDetailScreen id={id} />
}
