"use client"

import Link from "next/link"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { useOwner } from "@/lib/owners-api"

import { OwnerForm } from "../../owner-form"

export function EditOwner({ id }: { id: string }) {
  const query = useOwner(id)

  if (query.isPending) return <PageSkeleton cards={1} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el propietario"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/propietarios">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  return <OwnerForm owner={query.data} />
}
