import { redirect } from "next/navigation"

export default function Home() {
  // Sin sesión, el proxy ya mandó al login antes de llegar acá.
  redirect("/dashboard")
}
