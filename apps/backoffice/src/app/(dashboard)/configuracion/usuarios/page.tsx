import type { Metadata } from "next"

import { UsersScreen } from "./users-screen"

export const metadata: Metadata = { title: "Usuarios" }

export default function Page() {
  return <UsersScreen />
}
