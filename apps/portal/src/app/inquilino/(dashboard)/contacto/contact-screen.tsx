"use client"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { AgencyContact } from "@/components/agency-contact"
import { useRenterMe } from "@/lib/portal-api"

export function RenterContactScreen() {
  const me = useRenterMe()
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
      whatsappText={`Hola, soy ${me.data.fullName}, inquilino. Quería consultar algo.`}
    />
  )
}
