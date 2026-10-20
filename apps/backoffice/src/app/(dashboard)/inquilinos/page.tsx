import type { Metadata } from "next"

import { RenterList } from "./renter-list"

export const metadata: Metadata = { title: "Inquilinos" }

export default function Page() {
  return <RenterList />
}
