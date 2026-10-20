"use client"

import Link from "next/link"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { useRenter } from "@/lib/renters-api"

import { RenterForm } from "../../renter-form"

export function EditRenter({ id }: { id: string }) {
  const query = useRenter(id)

  if (query.isPending) return <PageSkeleton cards={1} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el inquilino"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/inquilinos">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  return <RenterForm renter={query.data} />
}
