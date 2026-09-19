"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, ImagePlus, X } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { apiErrorMessage, apiFieldErrors } from "@adminprop/session/client"
import type { PropertyDetail } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { Textarea } from "@adminprop/ui/components/textarea"
import { cn } from "@adminprop/ui/lib/utils"

import { LocationCascadeSelect } from "@/components/location-cascade-select"
import { MasterDataSelect } from "@/components/master-data-select"
import { MAX_PHOTOS } from "@/lib/properties"
import {
  useCreateProperty,
  useUpdateProperty,
  useUploadPropertyPhotos,
} from "@/lib/properties-api"

const schema = z.object({
  address: z.string().trim().min(1, "Ingresá la dirección.").max(200),
  locationId: z.string().min(1, "Elegí al menos la localidad."),
  propertyTypeId: z.string().min(1, "Elegí el tipo de propiedad."),
  amenityIds: z.array(z.string()),
  notes: z.string().max(5000),
})

type FormValues = z.infer<typeof schema>

const STEPS = [
  { title: "Datos", fields: ["address", "locationId", "propertyTypeId"] },
  { title: "Propietario", fields: [] },
  { title: "Amenities", fields: ["amenityIds", "notes"] },
  { title: "Fotos", fields: [] },
] as const

/** Borrador del alta en el navegador (spec 5.3). Sólo datos, no fotos. */
const DRAFT_KEY = "adminprop:property-draft"

/**
 * Un borrador está a medio cargar: se validan los tipos, no las reglas del
 * formulario (con ellas, cualquier campo vacío lo descartaría).
 */
const draftSchema = z
  .object({
    address: z.string(),
    locationId: z.string(),
    propertyTypeId: z.string(),
    amenityIds: z.array(z.string()),
    notes: z.string(),
  })
  .partial()

const EMPTY: FormValues = {
  address: "",
  locationId: "",
  propertyTypeId: "",
  amenityIds: [],
  notes: "",
}

function readDraft(): FormValues | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = draftSchema.safeParse(JSON.parse(raw))
    return parsed.success ? { ...EMPTY, ...parsed.data } : null
  } catch {
    return null
  }
}

/**
 * Alta y edición de propiedades como wizard (spec Fase 6, 5.3). En el alta,
 * lo cargado se guarda como borrador en el navegador y se recupera si el
 * usuario se va a mitad de camino. Las fotos del alta se suben al final; en
 * la edición se manejan desde la ficha.
 */
export function PropertyForm({ property }: { property?: PropertyDetail }) {
  const router = useRouter()
  const editing = property !== undefined
  const steps = editing ? STEPS.slice(0, 3) : STEPS
  const [step, setStep] = React.useState(0)
  const [photos, setPhotos] = React.useState<File[]>([])
  const [error, setError] = React.useState<string | null>(null)
  // El formulario sólo se renderiza en el navegador (detrás de SessionGate),
  // así que el borrador se lee al montar, sin un efecto.
  const [initialDraft] = React.useState(() =>
    editing || typeof window === "undefined" ? null : readDraft()
  )
  const [draftRestored, setDraftRestored] = React.useState(
    initialDraft !== null
  )

  const create = useCreateProperty()
  const update = useUpdateProperty()
  const upload = useUploadPropertyPhotos()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: property
      ? {
          address: property.address,
          locationId: property.locationId,
          propertyTypeId: property.propertyTypeId,
          amenityIds: property.amenityIds,
          notes: property.notes ?? "",
        }
      : (initialDraft ?? EMPTY),
  })

  const values = useWatch({ control: form.control })
  React.useEffect(() => {
    if (editing) return
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    } catch {
      // Sin storage (modo privado): el wizard funciona igual, sin borrador.
    }
  }, [editing, values])

  function discardDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      // nada que borrar
    }
    form.reset(EMPTY)
    setDraftRestored(false)
    setStep(0)
  }

  async function next() {
    const fields = [...steps[step]!.fields] as (keyof FormValues)[]
    if (await form.trigger(fields)) setStep((s) => s + 1)
  }

  async function onSubmit(data: FormValues) {
    setError(null)
    const body = {
      address: data.address,
      locationId: data.locationId,
      propertyTypeId: data.propertyTypeId,
      amenityIds: data.amenityIds,
      notes: data.notes.trim() || null,
    }
    try {
      const saved = editing
        ? await update.mutateAsync({ id: property.id, ...body })
        : await create.mutateAsync(body)

      if (!editing) {
        try {
          window.localStorage.removeItem(DRAFT_KEY)
        } catch {
          // ignorado
        }
      }

      if (photos.length > 0) {
        try {
          await upload.mutateAsync({ id: saved.id, files: photos })
        } catch (cause) {
          toast.error(
            `La propiedad se guardó, pero las fotos no se subieron: ${apiErrorMessage(cause, "probá de nuevo desde la ficha.")}`
          )
        }
      }

      toast.success(editing ? "Propiedad actualizada." : "Propiedad creada.")
      router.push(`/propiedades/${saved.id}`)
    } catch (cause) {
      const fields = apiFieldErrors(cause)
      for (const [field, message] of Object.entries(fields)) {
        if (field in EMPTY)
          form.setError(field as keyof FormValues, { message })
      }
      setError(apiErrorMessage(cause, "No se pudo guardar la propiedad."))
      // Volver al paso del primer campo con error.
      const firstStep = steps.findIndex((s) =>
        s.fields.some((f) => f in fields)
      )
      if (firstStep >= 0) setStep(firstStep)
    }
  }

  const isLast = step === steps.length - 1
  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Link
          href={editing ? `/propiedades/${property.id}` : "/propiedades"}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          {editing ? "Volver a la ficha" : "Propiedades"}
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {editing ? "Editar propiedad" : "Nueva propiedad"}
        </h1>
      </div>

      <ol
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
      >
        {steps.map((s, index) => (
          <li key={s.title} className="flex flex-col gap-1">
            <span
              className={cn(
                "h-1.5 rounded-full",
                index <= step ? "bg-primary" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "text-xs",
                index === step ? "font-medium" : "text-muted-foreground"
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {index + 1}. {s.title}
            </span>
          </li>
        ))}
      </ol>

      {draftRestored && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            Recuperamos lo que habías cargado.
            <Button variant="ghost" size="sm" onClick={discardDraft}>
              Empezar de cero
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (isLast) void form.handleSubmit(onSubmit)()
          else void next()
        }}
        noValidate
        className="flex flex-col gap-6"
      >
        <FieldGroup className={step === 0 ? "" : "hidden"}>
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-address">Dirección</FieldLabel>
                <Input
                  {...field}
                  id="property-address"
                  placeholder="Calle 7 1234, 3° B"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="locationId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-2">
                <LocationCascadeSelect
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? "")}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>
            )}
          />
          <Controller
            name="propertyTypeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-type">Tipo</FieldLabel>
                <MasterDataSelect
                  id="property-type"
                  source="property-types"
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? "")}
                  placeholder="Elegí el tipo"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {step === 1 && (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Asignar después</p>
            <p>
              El alta de propietarios llega en la próxima etapa. Por ahora la
              propiedad se guarda sin propietario y se le asigna desde su ficha.
            </p>
          </div>
        )}

        <FieldGroup className={step === 2 ? "" : "hidden"}>
          <Controller
            name="amenityIds"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="property-amenities">Amenities</FieldLabel>
                <MasterDataSelect
                  id="property-amenities"
                  source="amenities"
                  multiple
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Ninguna"
                />
              </Field>
            )}
          />
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-notes">
                  Observaciones (internas)
                </FieldLabel>
                <Textarea {...field} id="property-notes" rows={4} />
                <FieldDescription>
                  Sólo las ve la inmobiliaria: nunca salen en el portal.
                </FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>

        {step === 3 && !editing && (
          <PhotoPicker files={photos} onChange={setPhotos} />
        )}

        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0 || submitting}
          >
            Atrás
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Guardando…"
              : isLast
                ? editing
                  ? "Guardar cambios"
                  : "Crear propiedad"
                : "Siguiente"}
          </Button>
        </div>
      </form>
    </div>
  )
}

/** Paso 4: fotos con vista previa. Se suben al crear la propiedad. */
function PhotoPicker({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const previews = React.useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  )
  React.useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews]
  )

  function add(list: FileList | null) {
    if (!list) return
    const images = [...list].filter((f) =>
      /^image\/(jpeg|png|webp)$/.test(f.type)
    )
    const next = [...files, ...images].slice(0, MAX_PHOTOS)
    if (files.length + images.length > MAX_PHOTOS) {
      toast.warning(`Se pueden cargar hasta ${MAX_PHOTOS} fotos.`)
    }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="property-photos"
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-muted"
      >
        <ImagePlus aria-hidden className="size-6" />
        Agregar fotos (JPG, PNG o WebP, hasta {MAX_PHOTOS})
        <input
          id="property-photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            add(event.target.files)
            event.target.value = ""
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previews[index]}
                alt={file.name}
                className="aspect-square w-full rounded-md object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 text-xs">
                  Principal
                </span>
              )}
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="absolute top-1 right-1"
                aria-label={`Quitar ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">
        Podés saltear este paso y agregarlas después desde la ficha.
      </p>
    </div>
  )
}
