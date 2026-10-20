import type { Metadata } from "next"

import { OwnerForm } from "../owner-form"

export const metadata: Metadata = { title: "Nuevo propietario" }

export default function Page() {
  return <OwnerForm />
}
