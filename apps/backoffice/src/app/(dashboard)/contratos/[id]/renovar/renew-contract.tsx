"use client"

import Link from "next/link"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { useContract } from "@/lib/contracts-api"

import { ContractForm } from "../../contract-form"

/** Renovación (spec 3.7): el wizard precargado con el contrato original. */
export function RenewContract({ id }: { id: string }) {
  const query = useContract(id)

  if (query.isPending) return <PageSkeleton cards={1} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el contrato"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/contratos">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  if (query.data.status !== "ACTIVE") {
    return (
      <EmptyState
        title="Este contrato no se puede renovar"
        description="Sólo se renuevan los contratos activos. Si ya venció y quedó finalizado, cargá uno nuevo."
        action={
          <Button asChild variant="outline">
            <Link href={`/contratos/${id}`}>Volver al contrato</Link>
          </Button>
        }
      />
    )
  }
  return <ContractForm original={query.data} />
}
