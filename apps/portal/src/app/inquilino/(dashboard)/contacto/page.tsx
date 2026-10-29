import type { Metadata } from "next"

import { RenterContactScreen } from "./contact-screen"

export const metadata: Metadata = { title: "Contacto" }

export default function Page() {
  return <RenterContactScreen />
}
