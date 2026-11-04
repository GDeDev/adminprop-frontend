"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Label } from "@adminprop/ui/components/label"
import { Input } from "@adminprop/ui/components/input"

import { downloadExcelTemplate, useAnalyzeExcel } from "@/lib/migration-api"
import { migrationApiError, validateExcelFile } from "@/lib/migration"

import { startedBatchPath } from "./paths"

/** "Desde Excel": bajar la plantilla, completarla y subirla para analizar. */
export function ExcelCard() {
  const router = useRouter()
  const analyze = useAnalyzeExcel()
  const inputId = React.useId()
  const [file, setFile] = React.useState<File | null>(null)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const [downloading, setDownloading] = React.useState(false)

  async function template() {
    setDownloading(true)
    try {
      await downloadExcelTemplate()
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo descargar la plantilla."))
    } finally {
      setDownloading(false)
    }
  }

  function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null
    setFileError(picked ? validateExcelFile(picked) : null)
    setFile(picked)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!file || fileError) return
    try {
      const result = await analyze.mutateAsync(file)
      router.push(startedBatchPath(result))
    } catch (cause) {
      toast.error(migrationApiError(cause, "No se pudo analizar el archivo."))
    }
  }

  return (
    <section
      aria-labelledby="excel-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-raised"
    >
      <div className="flex items-start gap-3">
        <FileSpreadsheet aria-hidden className="mt-0.5 size-5 text-primary" />
        <div>
          <h2 id="excel-title" className="font-medium">
            Desde Excel
          </h2>
          <p className="text-sm text-muted-foreground">
            Propietarios, inquilinos, garantes, propiedades y contratos en una
            sola planilla. Los vínculos entre hojas son por DNI y por código.
          </p>
        </div>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Descargá la plantilla y completá las hojas que necesites.</li>
        <li>Subila: hasta 5.000 filas y 10 MB. Todavía no se importa nada.</li>
      </ol>

      <div>
        <Button
          variant="outline"
          onClick={() => void template()}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <Download aria-hidden />
          )}
          Descargar plantilla
        </Button>
      </div>

      <form onSubmit={(event) => void submit(event)} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={inputId}>Archivo .xlsx</Label>
          <Input
            id={inputId}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={pick}
            aria-invalid={fileError !== null}
            aria-describedby={fileError ? `${inputId}-error` : undefined}
          />
          {fileError && (
            <p
              id={`${inputId}-error`}
              role="alert"
              className="text-sm text-destructive"
            >
              {fileError}
            </p>
          )}
        </div>
        {analyze.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {migrationApiError(analyze.error, "No se pudo analizar.")}
            </AlertDescription>
          </Alert>
        )}
        <div>
          <Button
            type="submit"
            disabled={!file || !!fileError || analyze.isPending}
          >
            {analyze.isPending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Upload aria-hidden />
            )}
            Subir y analizar
          </Button>
        </div>
      </form>
    </section>
  )
}
