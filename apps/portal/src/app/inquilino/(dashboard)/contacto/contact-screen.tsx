"use client"

import { apiErrorMessage } from "@adminprop/session/client"
import { ErrorState } from "@adminprop/ui/components/error-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { AgencyContact } from "@/components/agency-contact"
import { useRenterMe } from "@/lib/portal-api"

export function RenterContactScreen() {
  const me = useRenterMe()
  if (me.isPending) return <PageSkeleton cards={1} />
  if (me.isError) {
    return (
      <ErrorState
        title="No pudimos cargar el contacto"
        description={apiErrorMessage(me.error, "Probá de nuevo en un rato.")}
        onRetry={() => void me.refetch()}
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
