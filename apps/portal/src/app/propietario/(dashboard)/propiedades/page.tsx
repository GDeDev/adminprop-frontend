import type { Metadata } from "next"

import { OwnerPropertiesScreen } from "./properties-screen"

export const metadata: Metadata = { title: "Mis propiedades" }

export default function Page() {
  return <OwnerPropertiesScreen />
}
