"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type {
  ImportBatchDetail,
  ImportResolution,
} from "@adminprop/shared-types"
import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { Checkbox } from "@adminprop/ui/components/checkbox"
import { Label } from "@adminprop/ui/components/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import {
  RESOLUTION_LABELS,
  confirmSummary,
  importableByEntity,
  migrationApiError,
} from "@/lib/migration"
import {
  downloadBatchReport,
  useConfirmBatch,
  useDiscardBatch,
} from "@/lib/migration-api"

import { CountsSummary } from "./counts-summary"
import { batchPath } from "./paths"
import { RowsList } from "./rows-list"

/** Paso 3 y 4: revisar el análisis y confirmar. El botón espera a `canConfirm`. */
export function ReviewStep({
  batch,
  onConfirming,
}: {
  batch: ImportBatchDetail
  onConfirming?: (open: boolean) => void
}) {
  const router = useRouter()
  const confirm = useConfirmBatch(batch.id)
  const discard = useDiscardBatch(batch.id)
  const [resolution, setResolution] = React.useState<ImportResolution>("SKIP")
  const [migrateAssets, setMigrateAssets] = React.useState(true)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [discardOpen, setDiscardOpen] = React.useState(false)
  const [reporting, setReporting] = React.useState(false)
  const resolutionId = React.useId()
  const assetsId = React.useId()

  const creatable = importableByEntity(batch.counts)
  const hasConflicts = batch.counts.conflicts > 0

  function openConfirm(open: boolean) {
    setConfirmOpen(open)
    onConfirming?.(open)
  }

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

  async function doConfirm() {
    try {
      const result = await confirm.mutateAsync({
        defaultConflictResolution: resolution,
        migrateAssets: batch.source === "TOKKO" ? migrateAssets : undefined,
      })
      openConfirm(false)
      router.replace(batchPath(result.batchId, result.jobId))
    } catch (cause) {
      toast.error(migrationApiError(cause, "No se pudo confirmar."))
    }
  }

  async function doDiscard() {
    try {
      await discard.mutateAsync()
      toast.success("El lote se descartó. No se importó nada.")
      router.push("/configuracion/migracion")
    } catch (cause) {
      toast.error(migrationApiError(cause, "No se pudo descartar el lote."))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <CountsSummary batch={batch} />

      {batch.counts.errors > 0 && (
        <p className="text-sm text-muted-foreground">
          Las filas con errores no se importan. Descargá el reporte, corregilas
          en el Excel y volvé a subirlo; lo ya importado no se duplica.
        </p>
      )}

      {hasConflicts && (
        <div className="grid gap-1.5 sm:max-w-sm">
          <Label htmlFor={resolutionId}>
            Conflictos: qué hacer por defecto
          </Label>
          <Select
            value={resolution}
            onValueChange={(value) => setResolution(value as ImportResolution)}
          >
            <SelectTrigger id={resolutionId} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RESOLUTION_LABELS) as ImportResolution[]).map(
                (value) => (
                  <SelectItem key={value} value={value}>
                    {RESOLUTION_LABELS[value]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            «Completar vacíos» solo rellena campos que están vacíos; nunca pisa
            un dato ya cargado. Podés elegir otra opción fila por fila.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => openConfirm(true)} disabled={!batch.canConfirm}>
          Confirmar importación
        </Button>
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
        <Button variant="ghost" onClick={() => setDiscardOpen(true)}>
          <Trash2 aria-hidden />
          Descartar lote
        </Button>
      </div>
      {!batch.canConfirm && (
        <p className="text-sm text-muted-foreground">
          No hay filas listas para importar. Corregí el archivo y volvé a
          subirlo.
        </p>
      )}

      <section aria-labelledby="rows-title" className="flex flex-col gap-2">
        <h2 id="rows-title" className="font-medium">
          Filas del análisis
        </h2>
        <RowsList batchId={batch.id} editable defaultResolution={resolution} />
      </section>

      <ResponsiveDialog open={confirmOpen} onOpenChange={openConfirm}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Confirmar importación</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {confirmSummary(creatable)} Se importa exactamente lo que
              revisaste; las filas con errores y las excluidas quedan afuera.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          {batch.source === "TOKKO" && (
            <div className="flex items-center gap-2 px-4 sm:px-0">
              <Checkbox
                id={assetsId}
                checked={migrateAssets}
                onCheckedChange={(value) => setMigrateAssets(value === true)}
              />
              <Label htmlFor={assetsId} className="font-normal">
                Migrar también las fotos
              </Label>
            </div>
          )}
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => openConfirm(false)}
              disabled={confirm.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void doConfirm()}
              disabled={confirm.isPending}
            >
              {confirm.isPending && (
                <Loader2 aria-hidden className="animate-spin" />
              )}
              Importar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Descartar el lote</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Se cierra sin importar nada y se borra el archivo subido. No se
              puede deshacer.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDiscardOpen(false)}
              disabled={discard.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void doDiscard()}
              disabled={discard.isPending}
            >
              Descartar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
