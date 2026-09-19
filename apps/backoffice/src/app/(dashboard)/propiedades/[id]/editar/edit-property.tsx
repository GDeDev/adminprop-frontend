"use client"

import Link from "next/link"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { useProperty } from "@/lib/properties-api"

import { PropertyForm } from "../../property-form"

export function EditProperty({ id }: { id: string }) {
  const query = useProperty(id)

  if (query.isPending) return <PageSkeleton cards={1} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar la propiedad"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/propiedades">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  return <PropertyForm property={query.data} />
}
