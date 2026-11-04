import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center p-4">
      <EmptyState
        icon={SearchX}
        title="No encontramos esa página"
        description="El link puede estar mal escrito o la página ya no existe."
        action={
          <Button asChild>
            <Link href="/dashboard">Ir al inicio</Link>
          </Button>
        }
        className="w-full"
      />
    </main>
  )
}
