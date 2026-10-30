import type { Metadata } from "next"

import { OwnerContactScreen } from "./contact-screen"

export const metadata: Metadata = { title: "Contacto" }

export default function Page() {
  return <OwnerContactScreen />
}
