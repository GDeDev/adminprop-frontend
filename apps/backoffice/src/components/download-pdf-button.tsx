"use client"

import * as React from "react"
import { FileDown, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { DocumentKind } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"

import { fetchDocument, useRegenerateDocument } from "@/lib/documents-api"

interface Props {
  kind: DocumentKind
  entityId: string
  label?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  /** Los administradores ven además "Regenerar" (una versión nueva del PDF). */
  canRegenerate?: boolean
}

/**
 * Descarga el PDF vigente de una entidad. Mientras la API lo genera (PENDING)
 * muestra un spinner y consulta cada 3 s hasta 30 s (rediseño Fase 15, sección 5).
 */
export function DownloadPdfButton({
  kind,
  entityId,
  label = "Descargar PDF",
  variant = "outline",
  size,
  canRegenerate = false,
}: Props) {
  const [busy, setBusy] = React.useState(false)

  async function download() {
    setBusy(true)
    try {
      const outcome = await fetchDocument(kind, entityId)
      if (outcome.state === "ready") {
        window.open(outcome.url, "_blank", "noopener,noreferrer")
      } else if (outcome.state === "failed") {
        toast.error(
          "No se pudo generar el PDF. Un administrador puede regenerarlo."
        )
      } else {
        toast.info("Todavía no está listo, probá en un momento.")
      }
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo descargar el PDF."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => void download()}
        disabled={busy}
      >
        {busy ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <FileDown aria-hidden />
        )}
        {busy ? "Preparando…" : label}
      </Button>
      {canRegenerate && (
        <RegenerateButton kind={kind} entityId={entityId} size={size} />
      )}
    </>
  )
}

function RegenerateButton({
  kind,
  entityId,
  size,
}: Pick<Props, "kind" | "entityId" | "size">) {
  const regenerate = useRegenerateDocument()

  async function regenerateDocument() {
    try {
      await regenerate.mutateAsync({ kind, entityId })
      toast.success("Se está generando una versión nueva del PDF.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo regenerar el PDF."))
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => void regenerateDocument()}
      disabled={regenerate.isPending}
    >
      <RefreshCw aria-hidden />
      Regenerar
    </Button>
  )
}
