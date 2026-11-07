import type { Metadata } from "next"

import { NotificationsScreen } from "./notifications-screen"

export const metadata: Metadata = { title: "Notificaciones" }

export default function Page() {
  return <NotificationsScreen />
}
