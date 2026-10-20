import type { Metadata } from "next"

import { PropertyList } from "./property-list"

export const metadata: Metadata = { title: "Propiedades" }

export default function Page() {
  return <PropertyList />
}
