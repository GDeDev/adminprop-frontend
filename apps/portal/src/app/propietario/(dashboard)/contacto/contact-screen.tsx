"use client"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { AgencyContact } from "@/components/agency-contact"
import { useOwnerMe } from "@/lib/portal-api"

export function OwnerContactScreen() {
  const me = useOwnerMe()
  if (me.isPending) return <PageSkeleton cards={1} />
  if (me.isError) {
    return (
      <EmptyState
        title="No pudimos cargar el contacto"
        description={apiErrorMessage(me.error, "Probá de nuevo en un rato.")}
        action={<Button onClick={() => void me.refetch()}>Reintentar</Button>}
      />
    )
  }
  return (
    <AgencyContact
      agency={me.data.agency}
      whatsappText={`Hola, soy ${me.data.fullName}, propietario. Quería consultar algo.`}
    />
  )
}
