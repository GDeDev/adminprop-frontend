import type { Metadata } from "next"

import { OwnerList } from "./owner-list"

export const metadata: Metadata = { title: "Propietarios" }

export default function Page() {
  return <OwnerList />
}
