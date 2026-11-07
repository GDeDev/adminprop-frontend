"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { formatDateTime } from "@/lib/automations"
import { SOURCE_LABELS, batchPhase, batchStatusMeta } from "@/lib/migration"
import { useBatch } from "@/lib/migration-api"

import { ProgressPanel } from "./progress-panel"
import { ResultStep } from "./result-step"
import { ReviewStep } from "./review-step"
import { Stepper, currentStep } from "./stepper"

/**
 * Un lote de migración. Muestra el paso que corresponde a su estado, así que
 * se puede cerrar la pestaña y volver desde el historial: análisis, revisión,
 * importación o resultado.
 */
export function BatchScreen({
  id,
  jobId,
}: {
  id: string
  jobId: string | null
}) {
  const { user } = useSession()
  const batch = useBatch(id)
  const [confirming, setConfirming] = React.useState(false)

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Solo para administradores"
        description="La migración de datos la hacen los administradores."
      />
    )
  }

  const data = batch.data
  const phase = data ? batchPhase(data.status) : null
  const meta = data ? batchStatusMeta(data.status) : null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/configuracion/migracion">
            <ChevronLeft aria-hidden />
            Migración de datos
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-title-lg font-semibold md:text-display-md">
            {data
              ? `Migración desde ${SOURCE_LABELS[data.source]}`
              : "Migración"}
          </h1>
          {meta && <Badge variant={meta.badge}>{meta.label}</Badge>}
        </div>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.fileName ? `${data.fileName} · ` : ""}
            {formatDateTime(data.createdAt)} · {data.createdBy.fullName}
          </p>
        )}
      </div>

      {phase && <Stepper current={currentStep(phase, confirming)} />}

      {batch.isPending ? (
        <PageSkeleton />
      ) : batch.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {apiErrorMessage(batch.error, "No se pudo cargar el lote.")}
          </AlertDescription>
        </Alert>
      ) : phase === "analyzing" ? (
        <ProgressPanel title="Analizando los datos…" jobId={jobId} />
      ) : phase === "importing" ? (
        <ProgressPanel title="Importando…" jobId={jobId} />
      ) : phase === "review" ? (
        <ReviewStep batch={data!} onConfirming={setConfirming} />
      ) : phase === "discarded" ? (
        <EmptyState
          title="Lote descartado"
          description="Este lote se cerró sin importar nada."
        />
      ) : (
        <ResultStep batch={data!} />
      )}
    </div>
  )
}
