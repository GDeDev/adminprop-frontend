"use client"

import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"

import type { PortalAgency } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"

import { whatsappUrl } from "@/lib/format"

/** Datos de contacto de la inmobiliaria (PRD 15.1 y 15.2), compartido por los dos portales. */
export function AgencyContact({
  agency,
  whatsappText,
}: {
  agency: PortalAgency
  whatsappText: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {agency.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Cómo comunicarte con la inmobiliaria.
        </p>
      </div>
      <section className="rounded-xl border bg-card p-5">
        <ul className="flex flex-col gap-3 text-sm">
          {agency.phone && (
            <li className="flex items-center gap-3">
              <Phone aria-hidden className="size-4 text-muted-foreground" />
              <a href={`tel:${agency.phone}`} className="hover:underline">
                {agency.phone}
              </a>
            </li>
          )}
          {agency.email && (
            <li className="flex items-center gap-3">
              <Mail aria-hidden className="size-4 text-muted-foreground" />
              <a href={`mailto:${agency.email}`} className="hover:underline">
                {agency.email}
              </a>
            </li>
          )}
          {agency.address && (
            <li className="flex items-center gap-3">
              <MapPin aria-hidden className="size-4 text-muted-foreground" />
              <span>{agency.address}</span>
            </li>
          )}
          {!agency.phone && !agency.email && !agency.address && (
            <li className="text-muted-foreground">
              La inmobiliaria todavía no cargó sus datos de contacto.
            </li>
          )}
        </ul>
        {agency.whatsapp && (
          <Button className="mt-4" asChild>
            <a
              href={whatsappUrl(agency.whatsapp, whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden />
              Escribir por WhatsApp
            </a>
          </Button>
        )}
      </section>
    </div>
  )
}
