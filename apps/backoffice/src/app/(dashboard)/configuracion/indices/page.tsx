import type { Metadata } from "next"

import { IndicesScreen } from "./indices-screen"

export const metadata: Metadata = { title: "Índices" }

export default function Page() {
  return <IndicesScreen />
}
