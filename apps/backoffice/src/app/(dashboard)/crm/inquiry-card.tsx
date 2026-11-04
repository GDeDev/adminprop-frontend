"use client"

import * as React from "react"
import {
  AlarmClock,
  Globe,
  GripVertical,
  Home,
  MessageCircle,
  Phone,
  PenLine,
  Store,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import type {
  InquiryCard,
  InquirySource,
  InquiryStage,
} from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { fetchWhatsAppLink, useContactAttempt } from "@/lib/crm-api"
import {
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
  ageLabel,
  crmApiError,
  initials,
  isFollowUpDue,
} from "@/lib/crm"
import { todayIso } from "@/lib/dates"

const SOURCE_ICONS: Record<InquirySource, LucideIcon> = {
  PORTAL: Globe,
  MERCADOLIBRE: Store,
  ZONAPROP: Store,
  ARGENPROP: Store,
  WHATSAPP: MessageCircle,
  PHONE: Phone,
  MANUAL: PenLine,
}

/**
 * Abre WhatsApp con el mensaje de la plantilla y registra el intento de
 * contacto. La pestaña se abre antes de pedir el link para que el navegador no
 * la bloquee (DT-101).
 */
export function useOpenWhatsApp() {
  const attempt = useContactAttempt()
  return React.useCallback(
    async (id: string, templateKey?: string) => {
      const tab = window.open("", "_blank")
      if (tab) tab.opener = null
      try {
        const link = await fetchWhatsAppLink(id, templateKey)
        if (!link.url) {
          tab?.close()
          toast.error("La consulta no tiene un teléfono válido para WhatsApp.")
          return
        }
        if (tab) tab.location.href = link.url
        else window.open(link.url, "_blank", "noopener,noreferrer")
        await attempt.mutateAsync({ id, channel: "WHATSAPP" })
      } catch (error) {
        tab?.close()
        toast.error(crmApiError(error, "No se pudo abrir WhatsApp."))
      }
    },
    [attempt]
  )
}

export interface CardViewProps {
  card: InquiryCard
  onOpen: (id: string) => void
  /** Mobile: selector «Mover a…» en vez de arrastrar. */
  onMoveTo?: (stage: InquiryStage) => void
  /** Props del botón de arrastre (desktop). */
  dragHandle?: React.ComponentProps<"button">
}

/** Tarjeta de una consulta, compartida por el tablero y la lista mobile. */
export function InquiryCardView({
  card,
  onOpen,
  onMoveTo,
  dragHandle,
}: CardViewProps) {
  const openWhatsApp = useOpenWhatsApp()
  const SourceIcon = SOURCE_ICONS[card.source]
  const due = isFollowUpDue(card, todayIso())

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-edge">
      <div className="flex items-start gap-2">
        {dragHandle && (
          <button
            type="button"
            {...dragHandle}
            aria-label={`Mover la consulta de ${card.name}`}
            className="-ml-1 flex size-8 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <GripVertical aria-hidden className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(card.id)}
          className="min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="block truncate font-medium">{card.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Home aria-hidden className="size-3 shrink-0" />
            <span className="truncate">
              {card.property?.address ?? "Consulta general"}
            </span>
          </span>
        </button>
        {card.assignedTo && (
          <span
            title={card.assignedTo.fullName}
            aria-label={`Asignada a ${card.assignedTo.fullName}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
          >
            {initials(card.assignedTo.fullName)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <SourceIcon aria-hidden className="size-3" />
          {SOURCE_LABELS[card.source]}
        </span>
        <span>{ageLabel(card.ageHours)}</span>
        {due && (
          <span className="flex items-center gap-1 font-medium text-destructive">
            <AlarmClock aria-hidden className="size-3" />
            Seguimiento vencido
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {card.hasWhatsApp && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void openWhatsApp(card.id)}
            aria-label={`WhatsApp a ${card.name}`}
          >
            <MessageCircle aria-hidden />
            WhatsApp
          </Button>
        )}
        {onMoveTo && (
          <Select
            value={card.stage}
            onValueChange={(v) => onMoveTo(v as InquiryStage)}
          >
            <SelectTrigger
              size="sm"
              aria-label={`Mover a… (${card.name})`}
              className="ml-auto"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
