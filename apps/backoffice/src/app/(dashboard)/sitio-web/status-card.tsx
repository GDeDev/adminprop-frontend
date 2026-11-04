"use client"

import { Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import type { SiteSettings } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"

import { formatDateTime } from "@/lib/automations"
import { SITE_STATUS_META, siteStatus } from "@/lib/site"

/** Estado del sitio (publicado, con cambios o sin publicar) y su dirección pública. */
export function StatusCard({
  settings,
  onChooseSubdomain,
}: {
  settings: SiteSettings
  onChooseSubdomain: () => void
}) {
  const status = siteStatus(settings)
  const meta = SITE_STATUS_META[status]
  const url = settings.publicUrl

  async function copy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Copiamos el link.")
    } catch {
      toast.error("No se pudo copiar. Seleccioná el link y copialo a mano.")
    }
  }

  return (
    <section
      aria-labelledby="site-status-title"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2
          id="site-status-title"
          className="font-display text-title-md font-semibold"
        >
          Estado del sitio
        </h2>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {status === "PUBLISHED" &&
          `Publicado el ${formatDateTime(settings.publishedAt!)}. Lo que ves en el borrador es lo que ve el público.`}
        {status === "DRAFT_CHANGES" &&
          "El sitio está en línea, pero el borrador tiene cambios que el público todavía no ve. Publicalos cuando estén listos."}
        {status === "UNPUBLISHED" &&
          (settings.publishedAt
            ? "El sitio está despublicado: el público ve una página de error. Tu configuración se conserva."
            : "Todavía no publicaste el sitio. Armalo con calma: nadie lo ve hasta que lo publiques.")}
      </p>
      {url ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 text-sm font-medium break-all underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {url}
          </a>
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Copiar el link del sitio"
              title="Copiar link"
              onClick={() => void copy()}
            >
              <Copy aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir el sitio en otra pestaña"
                title="Abrir el sitio"
              >
                <ExternalLink aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            Tu sitio todavía no tiene dirección: falta elegir un subdominio (o
            cargar un dominio propio).
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onChooseSubdomain}
            >
              Elegir subdominio
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </section>
  )
}
