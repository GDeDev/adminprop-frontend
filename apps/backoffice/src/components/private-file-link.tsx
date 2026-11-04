"use client"

import * as React from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { openInNewTab } from "@adminprop/ui/lib/open-in-new-tab"

import { isFileUrlFresh } from "@/lib/private-files"

interface Props {
  /** URL firmada tal como llegó con el recurso (vence a los 10 minutos). */
  url: string
  /** Cuándo llegó (ms), p. ej. `query.dataUpdatedAt`. */
  receivedAt: number
  /** Vuelve a pedir el recurso y devuelve la URL nueva. */
  refresh: () => Promise<string | null | undefined>
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
}

/**
 * Abre un archivo privado en una pestaña nueva. Si la URL que tenemos ya está
 * por vencer, pide el recurso de nuevo y abre la URL fresca.
 */
export function PrivateFileLink({
  url,
  receivedAt,
  refresh,
  children,
  variant = "ghost",
  size = "sm",
}: Props) {
  const [busy, setBusy] = React.useState(false)

  async function open() {
    setBusy(true)
    try {
      const opened = await openInNewTab(async () =>
        isFileUrlFresh(receivedAt) ? url : await refresh()
      )
      if (!opened) toast.error("No se pudo abrir el archivo.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo abrir el archivo."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => void open()}
      disabled={busy}
    >
      {busy ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : (
        <ExternalLink aria-hidden />
      )}
      {children}
    </Button>
  )
}
