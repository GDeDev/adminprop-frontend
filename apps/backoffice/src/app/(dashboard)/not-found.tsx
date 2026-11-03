import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"

/** Lo que se buscó no existe (o se eliminó): se muestra dentro del menú. */
export default function DashboardNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="No encontramos lo que buscabas"
      description="Puede que se haya eliminado o que el enlace esté viejo."
      action={
        <Button asChild>
          <Link href="/dashboard">Volver al inicio</Link>
        </Button>
      }
    />
  )
}
