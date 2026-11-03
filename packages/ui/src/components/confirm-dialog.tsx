"use client"

import * as React from "react"

import { Button } from "@adminprop/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pregunta con signos: "¿Eliminar al propietario?". */
  title: string
  description?: React.ReactNode
  /** Contenido extra entre la descripción y los botones (listas, avisos). */
  children?: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** `true` (por defecto) pinta el botón de confirmar como destructivo. */
  destructive?: boolean
  /** Mientras se ejecuta la acción: deshabilita ambos botones. */
  pending?: boolean
  /**
   * Se llama al confirmar. El diálogo no se cierra solo: quien lo usa cierra
   * (`onOpenChange(false)`) cuando la acción salió bien, así un error deja el
   * diálogo abierto.
   */
  onConfirm: () => void | Promise<unknown>
}

/**
 * Confirmación de acciones destructivas o sensibles (eliminar, desactivar,
 * reabrir, quitar). Reemplaza a los diálogos armados a mano y a
 * `window.confirm`.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive = true,
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          {description && (
            <ResponsiveDialogDescription>
              {description}
            </ResponsiveDialogDescription>
          )}
        </ResponsiveDialogHeader>
        {children && <div className="px-4 sm:px-0">{children}</div>}
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => void onConfirm()}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export { ConfirmDialog }
