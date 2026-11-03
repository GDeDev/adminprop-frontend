import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"

export const metadata = { title: "Página no encontrada" }

/** 404 de todo el backoffice: en español y con salida al inicio. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-4 py-10">
      <EmptyState
        icon={SearchX}
        title="No encontramos esta página"
        description="El enlace puede estar viejo o la dirección tener un error. Volvé al inicio y buscá desde ahí."
        action={
          <Button asChild>
            <Link href="/dashboard">Volver al inicio</Link>
          </Button>
        }
      />
    </main>
  )
}
