"use client"

import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Progress } from "@adminprop/ui/components/progress"
import { apiErrorMessage } from "@adminprop/session/client"

import { isJobFinished, useJobStatus } from "@/lib/jobs-api"
import { jobProgressLabel } from "@/lib/migration"

/**
 * Avance de un trabajo asíncrono (`GET /jobs/:id/status`). Sin `jobId` (se
 * reabrió el lote desde el historial) muestra un avance indeterminado: el
 * estado del lote lo sigue la pantalla.
 */
export function ProgressPanel({
  title,
  jobId,
}: {
  title: string
  jobId: string | null
}) {
  const status = useJobStatus(jobId)
  const job = status.data
  const finished = job ? isJobFinished(job.status) : false

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
    >
      <p className="font-medium">{title}</p>
      {status.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {apiErrorMessage(
              status.error,
              "No se pudo consultar el avance del trabajo."
            )}
          </AlertDescription>
        </Alert>
      ) : !job ? (
        <>
          <Progress aria-label="Avance" value={0} />
          <p className="text-sm text-muted-foreground">
            {jobId ? "Iniciando…" : "Esto puede tardar unos minutos."}
          </p>
        </>
      ) : (
        <>
          <Progress
            aria-label="Avance"
            value={job.progress ?? (finished ? 100 : 0)}
          />
          <p className="text-sm text-muted-foreground">
            {jobProgressLabel(
              job.processedItems,
              job.totalItems,
              job.failedItems
            )}
          </p>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Podés salir de esta pantalla: el trabajo sigue y el lote queda en el
        historial.
      </p>
    </div>
  )
}
