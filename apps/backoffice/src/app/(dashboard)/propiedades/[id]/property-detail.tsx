"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  FileText,
  ImageOff,
  ImagePlus,
  Pencil,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type { PropertyDetail, PropertyStatus } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adminprop/ui/components/dropdown-menu"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

import { AmenityIcon } from "@/components/amenity-icon"
import { MANUAL_TRANSITIONS, MAX_PHOTOS, STATUS_META } from "@/lib/properties"
import {
  useChangePropertyStatus,
  useDeleteProperty,
  useDeletePropertyPhoto,
  useProperty,
  useUploadPropertyPhotos,
} from "@/lib/properties-api"

import { StatusBadge } from "../property-list"

/** Ficha de propiedad (spec Fase 6, 5.2). */
export function PropertyDetailScreen({ id }: { id: string }) {
  const query = useProperty(id)

  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar la propiedad"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/propiedades">Volver al listado</Link>
          </Button>
        }
      />
    )
  }

  return <Detail property={query.data} />
}

function Detail({ property }: { property: PropertyDetail }) {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/propiedades"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Propiedades
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {property.address}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[property.propertyType?.name, property.location?.path]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusControl property={property} />
            <Button variant="outline" asChild>
              <Link href={`/propiedades/${property.id}/editar`}>
                <Pencil aria-hidden />
                Editar
              </Link>
            </Button>
            {user?.role === "ADMIN" && <DeleteButton property={property} />}
          </div>
        </div>
      </div>

      <PhotoCarousel photos={property.photos} address={property.address} />

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Datos">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Tipo</dt>
            <dd>
              {property.propertyType?.name ?? "—"}
              {property.propertyType && !property.propertyType.isActive && (
                <span className="text-muted-foreground"> (desactivado)</span>
              )}
            </dd>
            <dt className="text-muted-foreground">Ubicación</dt>
            <dd>{property.location?.path ?? "—"}</dd>
            <dt className="text-muted-foreground">Estado</dt>
            <dd>
              <StatusBadge status={property.status} />
            </dd>
          </dl>
          {property.notes && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm whitespace-pre-line">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Observaciones internas
              </p>
              {property.notes}
            </div>
          )}
        </Section>

        <Section title="Amenities">
          {property.amenities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin amenities.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <li key={amenity.id}>
                  <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
                    <AmenityIcon name={amenity.icon} className="size-3.5" />
                    {amenity.name}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Placeholder
          icon={UserRound}
          title="Propietario"
          text="Sin propietario asignado. El alta de propietarios llega en la próxima etapa."
        />
        <Placeholder
          icon={FileText}
          title="Contrato activo"
          text="Los contratos se cargan en una etapa posterior."
        />
        <Placeholder
          icon={Wallet}
          title="Historial de pagos"
          text="Aparece cuando existan contratos y cobros."
        />
      </div>

      <PhotoManager property={property} />
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/** Espacio reservado para lo que llega en otras fases (spec 5.2). */
function Placeholder({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof UserRound
  title: string
  text: string
}) {
  return (
    <section className="flex items-start gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        <h2 className="font-medium text-foreground">{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  )
}

/**
 * Carrusel con scroll-snap: se desliza con el dedo en mobile y con la rueda
 * en desktop, sin librería. Sin fotos, un lugar vacío (spec, casos borde).
 */
function PhotoCarousel({
  photos,
  address,
}: {
  photos: PropertyDetail["photos"]
  address: string
}) {
  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/9] max-h-80 w-full flex-col items-center justify-center gap-2 rounded-xl bg-muted text-muted-foreground md:aspect-[21/9]">
        <ImageOff aria-hidden className="size-8" />
        <p className="text-sm">Sin fotos</p>
      </div>
    )
  }
  return (
    <ul
      className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-xl"
      aria-label={`Fotos de ${address}`}
    >
      {photos.map((photo, index) => (
        <li key={photo.id} className="w-full shrink-0 snap-center md:w-2/3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={`Foto ${index + 1} de ${photos.length}`}
            loading={index === 0 ? "eager" : "lazy"}
            className="aspect-[4/3] w-full rounded-xl object-cover md:aspect-[16/10]"
          />
        </li>
      ))}
    </ul>
  )
}

function StatusControl({ property }: { property: PropertyDetail }) {
  const change = useChangePropertyStatus()

  async function setStatus(status: PropertyStatus) {
    try {
      await change.mutateAsync({ id: property.id, status })
      toast.success(`Ahora está ${STATUS_META[status].label.toLowerCase()}.`)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo cambiar el estado."))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={change.isPending}>
          Cambiar estado
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MANUAL_TRANSITIONS[property.status].map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => void setStatus(status)}
          >
            Pasar a {STATUS_META[status].label.toLowerCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DeleteButton({ property }: { property: PropertyDetail }) {
  const router = useRouter()
  const remove = useDeleteProperty()
  const [open, setOpen] = React.useState(false)

  async function confirm() {
    try {
      await remove.mutateAsync(property.id)
      toast.success("Propiedad eliminada.")
      router.push("/propiedades")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo eliminar."))
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Eliminar propiedad"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              ¿Eliminar la propiedad?
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {property.address} deja de aparecer en el sistema. Si tiene
              contratos, no se puede eliminar: pasala a mantenimiento.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirm()}
              disabled={remove.isPending}
            >
              Eliminar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  )
}

/** Agregar y quitar fotos desde la ficha. */
function PhotoManager({ property }: { property: PropertyDetail }) {
  const upload = useUploadPropertyPhotos()
  const remove = useDeletePropertyPhoto()
  const remaining = MAX_PHOTOS - property.photos.length

  async function add(list: FileList | null) {
    if (!list || list.length === 0) return
    const files = [...list].slice(0, remaining)
    if (list.length > remaining) {
      toast.warning(
        `Sólo entran ${remaining} fotos más (máximo ${MAX_PHOTOS}).`
      )
    }
    try {
      await upload.mutateAsync({ id: property.id, files })
      toast.success(files.length === 1 ? "Foto agregada." : "Fotos agregadas.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudieron subir las fotos."))
    }
  }

  async function removePhoto(photoId: string) {
    try {
      await remove.mutateAsync({ id: property.id, photoId })
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo borrar la foto."))
    }
  }

  return (
    <Section title={`Fotos (${property.photos.length} de ${MAX_PHOTOS})`}>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {property.photos.map((photo, index) => (
          <li key={photo.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Foto ${index + 1}`}
              className="aspect-square w-full rounded-md object-cover"
            />
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 text-xs">
                Principal
              </span>
            )}
            <Button
              size="icon-sm"
              variant="secondary"
              className="absolute top-1 right-1"
              aria-label={`Borrar foto ${index + 1}`}
              disabled={remove.isPending}
              onClick={() => void removePhoto(photo.id)}
            >
              <X aria-hidden />
            </Button>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <label
              htmlFor="add-photos"
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-muted"
            >
              <ImagePlus aria-hidden className="size-5" />
              {upload.isPending ? "Subiendo…" : "Agregar"}
              <input
                id="add-photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={upload.isPending}
                className="sr-only"
                onChange={(event) => {
                  void add(event.target.files)
                  event.target.value = ""
                }}
              />
            </label>
          </li>
        )}
      </ul>
    </Section>
  )
}
