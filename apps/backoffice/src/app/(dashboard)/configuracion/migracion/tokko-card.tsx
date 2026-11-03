"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Building2, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Checkbox } from "@adminprop/ui/components/checkbox"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"

import { migrationApiError } from "@/lib/migration"
import { useAnalyzeTokko } from "@/lib/migration-api"

import { startedBatchPath } from "./paths"

/** Valor de "Cantidad máxima": vacío = todas; si no, un entero positivo. */
export function parseLimit(raw: string): number | undefined | "invalid" {
  const text = raw.trim()
  if (text === "") return undefined
  if (!/^\d+$/.test(text) || Number(text) < 1) return "invalid"
  return Number(text)
}

/** "Desde Tokko": la key vive en el servidor; acá sólo se elige qué traer. */
export function TokkoCard() {
  const router = useRouter()
  const analyze = useAnalyzeTokko()
  const id = React.useId()
  const [limit, setLimit] = React.useState("")
  const [includeAssets, setIncludeAssets] = React.useState(true)
  const parsed = parseLimit(limit)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (parsed === "invalid") return
    try {
      const result = await analyze.mutateAsync({
        includeAssets,
        ...(parsed !== undefined ? { limit: parsed } : {}),
      })
      router.push(startedBatchPath(result))
    } catch (cause) {
      toast.error(migrationApiError(cause, "No se pudo consultar Tokko."))
    }
  }

  return (
    <section
      aria-labelledby="tokko-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <Building2 aria-hidden className="mt-0.5 size-5 text-primary" />
        <div>
          <h2 id="tokko-title" className="font-medium">
            Desde Tokko
          </h2>
          <p className="text-sm text-muted-foreground">
            Trae las propiedades en alquiler con su ubicación, tipo, amenities y
            fotos. Propietarios, inquilinos y contratos vienen por Excel.
          </p>
        </div>
      </div>

      <form onSubmit={(event) => void submit(event)} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-limit`}>Cantidad máxima (opcional)</Label>
          <Input
            id={`${id}-limit`}
            inputMode="numeric"
            placeholder="Todas"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            aria-invalid={parsed === "invalid"}
            aria-describedby={`${id}-limit-hint`}
            className="sm:max-w-40"
          />
          <p
            id={`${id}-limit-hint`}
            className={
              parsed === "invalid"
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
            role={parsed === "invalid" ? "alert" : undefined}
          >
            {parsed === "invalid"
              ? "Ingresá un número entero mayor que 0."
              : "Útil para probar con pocas propiedades."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id={`${id}-assets`}
            checked={includeAssets}
            onCheckedChange={(value) => setIncludeAssets(value === true)}
          />
          <Label htmlFor={`${id}-assets`}>Incluir fotos</Label>
        </div>

        {analyze.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {migrationApiError(analyze.error, "No se pudo consultar Tokko.")}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Button
            type="submit"
            disabled={parsed === "invalid" || analyze.isPending}
          >
            {analyze.isPending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Search aria-hidden />
            )}
            Analizar Tokko
          </Button>
        </div>
      </form>
    </section>
  )
}
