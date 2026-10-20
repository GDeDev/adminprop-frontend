"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { PortalCredentials } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

/**
 * Genera (o regenera) el acceso al portal de un propietario o inquilino. La
 * contraseña se ve una sola vez, acá: la API no la guarda ni la vuelve a
 * mostrar (D-42). Quien lo usa pasa la mutación que corresponde.
 */
export function PortalCredentialsDialog({
  person,
  portalName,
  issue,
  open,
  onOpenChange,
}: {
  person: { fullName: string; hasPortalAccess: boolean }
  /** "propietarios" o "inquilinos", para el texto. */
  portalName: string
  issue: { mutateAsync: () => Promise<PortalCredentials>; isPending: boolean }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [credentials, setCredentials] =
    React.useState<PortalCredentials | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const regenerating = person.hasPortalAccess

  async function confirm() {
    setError(null)
    try {
      setCredentials(await issue.mutateAsync())
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo generar el acceso."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {credentials
              ? "Acceso generado"
              : regenerating
                ? "¿Generar una contraseña nueva?"
                : "¿Darle acceso al portal?"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {credentials
              ? "Pasale estos datos. La contraseña no se vuelve a mostrar: si la pierde, generá otra."
              : regenerating
                ? `La contraseña anterior de ${person.fullName} deja de servir y se cierran sus sesiones.`
                : `${person.fullName} va a poder entrar al portal de ${portalName} con su email.`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-3 px-4 md:px-0">
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {credentials && (
            <dl className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Usuario</dt>
                <dd className="break-all">{credentials.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Contraseña</dt>
                <dd className="flex items-center justify-between gap-2">
                  <code className="font-mono text-base tracking-wide">
                    {credentials.password}
                  </code>
                  <CopyButton
                    value={`${credentials.email}\n${credentials.password}`}
                  />
                </dd>
              </div>
            </dl>
          )}
        </div>

        <ResponsiveDialogFooter>
          {credentials ? (
            <Button onClick={() => onOpenChange(false)}>Listo</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={issue.isPending}
              >
                Cancelar
              </Button>
              <Button onClick={() => void confirm()} disabled={issue.isPending}>
                {issue.isPending
                  ? "Generando…"
                  : regenerating
                    ? "Generar nueva"
                    : "Generar acceso"}
              </Button>
            </>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar. Seleccionalo a mano.")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Copiar usuario y contraseña"
      onClick={() => void copy()}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  )
}
