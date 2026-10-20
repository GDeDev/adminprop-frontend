import type { Metadata } from "next"

import { PropertyForm } from "../property-form"

export const metadata: Metadata = { title: "Nueva propiedad" }

export default function Page() {
  return <PropertyForm />
}
