"use client"

import * as React from "react"
import { ExternalLink, Upload } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"

import { documentProblem } from "@/lib/contracts"
import {
  useUploadContractDocument,
  type ContractDocumentKind,
} from "@/lib/contracts-api"

/**
 * "Ver PDF" + "Subir / Reemplazar" del contrato escaneado o de la póliza
 * (spec 5.2). Un PDF nuevo reemplaza al anterior (D-62).
 */
export function DocumentActions({
  contractId,
  kind,
  url,
  label,
}: {
  contractId: string
  kind: ContractDocumentKind
  url: string | null
  /** "contrato" o "póliza", para los textos. */
  label: string
}) {
  const upload = useUploadContractDocument()
  const inputId = React.useId()

  async function pick(list: FileList | null) {
    const file = list?.[0]
    if (!file) return
    const problem = documentProblem(file)
    if (problem) {
      toast.error(problem)
      return
    }
    try {
      await upload.mutateAsync({ id: contractId, kind, file })
      toast.success(`PDF de ${label} guardado.`)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo subir el PDF."))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {url && (
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            Ver {label === "contrato" ? "PDF" : "póliza"}
          </a>
        </Button>
      )}
      <Button variant="outline" size="sm" asChild disabled={upload.isPending}>
        <label htmlFor={inputId} className="cursor-pointer">
          <Upload aria-hidden />
          {upload.isPending
            ? "Subiendo…"
            : url
              ? "Reemplazar PDF"
              : `Subir PDF de ${label}`}
          <input
            id={inputId}
            type="file"
            accept="application/pdf,.pdf"
            disabled={upload.isPending}
            className="sr-only"
            onChange={(event) => {
              void pick(event.target.files)
              event.target.value = ""
            }}
          />
        </label>
      </Button>
    </div>
  )
}
