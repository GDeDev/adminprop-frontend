import type { Metadata } from "next"

import { GuarantorList } from "./guarantor-list"

export const metadata: Metadata = { title: "Garantes" }

export default function Page() {
  return <GuarantorList />
}
