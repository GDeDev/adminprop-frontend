import { redirect } from "next/navigation"

export default function Home() {
  // TODO(Fase 4): redirigir a /login si no hay sesión.
  redirect("/dashboard")
}
