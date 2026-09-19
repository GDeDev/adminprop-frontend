"use client"

import * as React from "react"
import { cn } from "cn"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@adminprop/ui/components/dialog"

/**
 * Bottom sheet para acciones contextuales: se ancla abajo en mobile y se
 * comporta como un dialog centrado desde `sm` en adelante. Reusa la API de
 * Dialog (open/onOpenChange, Trigger, Header, Footer…).
 */
function BottomSheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="bottom-sheet-content"
        className={cn(
          // Mobile: anclado abajo, ancho completo
          "fixed inset-x-0 bottom-0 z-50 grid max-h-[85svh] gap-4 overflow-y-auto rounded-t-2xl bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none data-closed:animate-out data-closed:slide-out-to-bottom data-open:animate-in data-open:slide-in-from-bottom",
          // Desktop: dialog centrado
          "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-4 sm:data-closed:fade-out-0 sm:data-closed:zoom-out-95 sm:data-open:fade-in-0 sm:data-open:zoom-in-95",
          className
        )}
        {...props}
      >
        <div
          aria-hidden
          className="mx-auto -mt-1 h-1.5 w-10 rounded-full bg-muted sm:hidden"
        />
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2 hidden sm:inline-flex"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export {
  Dialog as BottomSheet,
  DialogTrigger as BottomSheetTrigger,
  DialogClose as BottomSheetClose,
  BottomSheetContent,
  DialogHeader as BottomSheetHeader,
  DialogFooter as BottomSheetFooter,
  DialogTitle as BottomSheetTitle,
  DialogDescription as BottomSheetDescription,
}
