"use client"

import * as React from "react"
import {
  ExternalLink,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"
import { cn } from "@adminprop/ui/lib/utils"

import { useSitePreviewToken } from "@/lib/site-api"
import { previewUrl } from "@/lib/site"

const VIEWPORTS = [
  { key: "mobile", label: "Móvil", width: 375, icon: Smartphone },
  { key: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { key: "desktop", label: "Escritorio", width: 1280, icon: Monitor },
] as const

const PANEL_HEIGHT = "min(70svh, 44rem)"

/**
 * Vista previa del sitio en modo borrador: un iframe al ancho real del
 * dispositivo elegido, escalado con CSS para que entre en el panel.
 * `version` cambia después de cada guardado y recarga el iframe.
 */
export function PreviewPanel({
  slug,
  version,
}: {
  slug: string | undefined
  version: number
}) {
  const token = useSitePreviewToken(slug !== undefined)
  const [viewportKey, setViewportKey] =
    React.useState<(typeof VIEWPORTS)[number]["key"]>("mobile")
  const viewport = VIEWPORTS.find((v) => v.key === viewportKey)!
  const [reload, setReload] = React.useState(0)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const [available, setAvailable] = React.useState(0)
  React.useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const measure = () => setAvailable(element.clientWidth)
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scale = available > 0 ? Math.min(1, available / viewport.width) : 1
  // El token se renueva solo antes de vencer (ver `useSitePreviewToken`); al
  // cambiar, el iframe se recarga con el nuevo: una vez cada ~14 minutos.
  const liveToken = token.data?.token ?? null
  const src = slug && liveToken ? previewUrl(slug, liveToken) : null

  return (
    <section
      aria-labelledby="site-preview-title"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="site-preview-title"
          className="font-display text-title-md font-semibold"
        >
          Vista previa
        </h2>
        <div className="flex items-center gap-1">
          <div
            role="radiogroup"
            aria-label="Ancho de la vista previa"
            className="flex gap-1"
          >
            {VIEWPORTS.map(({ key, label, width, icon: Icon }) => (
              <Button
                key={key}
                type="button"
                role="radio"
                aria-checked={viewportKey === key}
                variant={viewportKey === key ? "secondary" : "ghost"}
                size="icon"
                aria-label={`${label} (${width} px)`}
                title={`${label} (${width} px)`}
                onClick={() => setViewportKey(key)}
              >
                <Icon aria-hidden />
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Recargar la vista previa"
            title="Recargar"
            onClick={() => setReload((n) => n + 1)}
          >
            <RefreshCw aria-hidden />
          </Button>
          {src && (
            <Button variant="ghost" size="icon" asChild>
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir la vista previa en otra pestaña"
                title="Abrir en otra pestaña"
              >
                <ExternalLink aria-hidden />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative w-full overflow-hidden rounded-lg border bg-muted",
          !src && "grid place-items-center"
        )}
        style={{ height: PANEL_HEIGHT }}
      >
        {slug === undefined || token.isPending ? (
          <Skeleton
            className="size-full"
            aria-label="Preparando la vista previa…"
          />
        ) : token.isError || !src ? (
          <Alert variant="destructive" role="alert" className="m-4 w-auto">
            <AlertDescription className="flex flex-col items-start gap-2">
              {token.isError
                ? apiErrorMessage(
                    token.error,
                    "No se pudo preparar la vista previa."
                  )
                : "No se pudo preparar la vista previa."}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void token.refetch()}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div
            className="absolute top-0 left-1/2 origin-top-left"
            style={{
              width: viewport.width,
              height: `calc(${PANEL_HEIGHT} / ${scale})`,
              transform: `translateX(${(-viewport.width * scale) / 2}px) scale(${scale})`,
            }}
          >
            <iframe
              key={`${version}-${reload}`}
              title={`Vista previa del sitio (${viewport.label.toLowerCase()}, ${viewport.width} px)`}
              src={src}
              className="size-full border-0 bg-background"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Es el borrador: muestra lo que guardaste, no lo publicado.{" "}
        {scale < 1 && `Se ve reducido al ${Math.round(scale * 100)} %.`}
      </p>
    </section>
  )
}
