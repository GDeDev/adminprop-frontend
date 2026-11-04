"use client"

import * as React from "react"
import Link from "next/link"
import { Download, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import type { ImportBatchDetail } from "@adminprop/shared-types"
import { apiErrorMessage } from "@adminprop/session/client"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"

import { isJobFinished, useJobStatus } from "@/lib/jobs-api"
import { migrationApiError } from "@/lib/migration"
import { downloadBatchReport, useRetryAssets } from "@/lib/migration-api"

import { CountsSummary } from "./counts-summary"
import { ProgressPanel } from "./progress-panel"
import { RowsList } from "./rows-list"

/** Paso 5: qué se importó, qué falló y el estado de las fotos. */
export function ResultStep({ batch }: { batch: ImportBatchDetail }) {
  const retry = useRetryAssets(batch.id)
  const [retryJobId, setRetryJobId] = React.useState<string | null>(null)
  const retryStatus = useJobStatus(retryJobId)
  const [reporting, setReporting] = React.useState(false)
  const { counts, assets } = batch

  const retrying =
    retryJobId !== null &&
    !(retryStatus.data && isJobFinished(retryStatus.data.status))

  async function report() {
    setReporting(true)
    try {
      await downloadBatchReport(batch.id)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo descargar el reporte."))
    } finally {
      setReporting(false)
    }
  }

  async function retryAssets() {
    try {
      const result = await retry.mutateAsync()
      setRetryJobId(result.jobId)
    } catch (cause) {
      toast.error(migrationApiError(cause, "No se pudo reintentar las fotos."))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {batch.status === "FAILED" && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            La migración falló y no se importó nada nuevo. Revisá el detalle de
            las filas, o volvé a intentar el análisis; si el origen es Tokko,
            comprobá que la API key sea válida.
          </AlertDescription>
        </Alert>
      )}
      {batch.status === "PARTIAL" && (
        <Alert>
          <AlertDescription>
            Se importó lo que se pudo. Las filas que fallaron figuran abajo y en
            el reporte; no revierten lo ya importado.
          </AlertDescription>
        </Alert>
      )}

      <dl
        aria-label="Resultado"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <Stat label="Importadas" value={counts.imported} />
        <Stat label="Fallidas" value={counts.failed} tone="error" />
        <Stat label="Salteadas" value={counts.skipped} />
        <Stat label="Ya importadas" value={counts.alreadyImported} />
      </dl>

      <CountsSummary batch={batch} imported />

      {(assets.migrated > 0 || assets.failed > 0 || assets.pending > 0) && (
        <section
          aria-labelledby="assets-title"
          className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-raised"
        >
          <h2 id="assets-title" className="font-medium">
            Fotos
          </h2>
          <p className="text-sm">
            {assets.migrated} migradas · {assets.failed} fallidas ·{" "}
            {assets.pending} pendientes
          </p>
          {retrying && (
            <ProgressPanel title="Reintentando fotos…" jobId={retryJobId} />
          )}
          {assets.failed > 0 && (
            <div>
              <Button
                variant="outline"
                onClick={() => void retryAssets()}
                disabled={retry.isPending || retrying}
              >
                {retry.isPending ? (
                  <Loader2 aria-hidden className="animate-spin" />
                ) : (
                  <RotateCcw aria-hidden />
                )}
                Reintentar fotos
              </Button>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {counts.needsReview > 0 && (
          <Button asChild>
            <Link href="/propiedades?needsReview=true">
              Ver propiedades a revisar ({counts.needsReview})
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => void report()}
          disabled={reporting}
        >
          {reporting ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <Download aria-hidden />
          )}
          Descargar reporte
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/configuracion/migracion">Volver a Migración</Link>
        </Button>
      </div>

      <section aria-labelledby="rows-title" className="flex flex-col gap-2">
        <h2 id="rows-title" className="font-medium">
          Detalle por fila
        </h2>
        <RowsList
          batchId={batch.id}
          editable={false}
          defaultResolution="SKIP"
        />
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "error"
}) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-raised">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          "text-2xl font-semibold " +
          (tone === "error" && value > 0 ? "text-destructive" : "")
        }
      >
        {value}
      </dd>
    </div>
  )
}
