import type { Metadata } from "next"

import { RenterForm } from "../renter-form"

export const metadata: Metadata = { title: "Nuevo inquilino" }

export default function Page() {
  return <RenterForm />
}
