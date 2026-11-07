import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"

import { PublicHeader } from "@/components/public-header"

export const metadata = { title: "Página no encontrada" }

/** 404 del portal: en español y con salida al listado de propiedades. */
export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-xl flex-col px-4 py-16">
        <EmptyState
          icon={SearchX}
          title="No encontramos esta página"
          description="Puede que la propiedad ya no esté disponible o que el enlace esté viejo."
          action={
            <Button asChild>
              <Link href="/">Ver propiedades disponibles</Link>
            </Button>
          }
        />
      </main>
    </>
  )
}
