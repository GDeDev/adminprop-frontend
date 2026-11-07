"use client"

import * as React from "react"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"

import { openPortalPdf } from "@/lib/portal-api"

/**
 * Descarga un PDF del portal. La API autentica con el token (no con cookies),
 * así que un link directo daría 401: se pide `?format=json` por el cliente
 * HTTP y se abre la URL del archivo (D-114).
 */
export function PortalPdfButton({
  path,
  label,
  variant = "outline",
  size,
}: {
  path: string
  label: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  const [busy, setBusy] = React.useState(false)

  async function open() {
    setBusy(true)
    try {
      await openPortalPdf(path)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo abrir el PDF."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => void open()}
      disabled={busy}
    >
      {busy ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : (
        <FileDown aria-hidden />
      )}
      {label}
    </Button>
  )
}
