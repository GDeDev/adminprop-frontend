"use client"

import { ChevronDown, MessageCircle } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@adminprop/ui/components/dropdown-menu"

import { useWhatsAppTemplates } from "@/lib/notifications-api"
import { buildWhatsAppLink, fillTemplate } from "@/lib/whatsapp"

import { useTenantName } from "./tenant-name"

interface Props {
  phone: string | null | undefined
  /** Claves de plantilla ofrecidas (ej. `PAYMENT_REMINDER`, `ARREARS`). */
  templateKeys: string[]
  /** Valores de las variables `{{...}}` de la plantilla. */
  values: Record<string, string | null | undefined>
  size?: React.ComponentProps<typeof Button>["size"]
}

/**
 * Botón de WhatsApp (rediseño Fase 14, sección 7): abre `wa.me` con el texto de
 * la plantilla elegida. Se oculta sin teléfono utilizable. Si las plantillas no
 * cargan, queda un link directo sin mensaje.
 */
export function WhatsAppButton({ phone, templateKeys, values, size }: Props) {
  const tenantName = useTenantName()
  const templates = useWhatsAppTemplates()
  const plainLink = buildWhatsAppLink(phone)
  if (!plainLink) return null

  const offered =
    templates.data?.filter((template) => templateKeys.includes(template.key)) ??
    []

  if (offered.length === 0) {
    return (
      <Button variant="outline" size={size} asChild>
        <a href={plainLink} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden />
          WhatsApp
        </a>
      </Button>
    )
  }

  const allValues = { agencyName: tenantName, ...values }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size}>
          <MessageCircle aria-hidden />
          WhatsApp
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Enviar mensaje</DropdownMenuLabel>
        {offered.map((template) => (
          <DropdownMenuItem key={template.key} asChild>
            <a
              href={
                buildWhatsAppLink(
                  phone,
                  fillTemplate(template.body, allValues)
                ) ?? plainLink
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              {template.title}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={plainLink} target="_blank" rel="noopener noreferrer">
            Chat vacío
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
