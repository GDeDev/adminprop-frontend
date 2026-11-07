"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calculator, ChevronLeft, ImagePlus, X } from "lucide-react"
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { LocationCascadeSelect } from "@/components/location-cascade-select"
import { MasterDataSelect } from "@/components/master-data-select"
import { OwnerSelect } from "@/components/owner-select"
import { CURRENCY_LABELS } from "@/lib/contracts"
import { useDraftKey } from "@/lib/drafts"
import { OVERSIZED_PHOTO_MESSAGE, splitOversizedPhotos } from "@/lib/photos"
import {
  LISTING_LIMITS,
  MAX_PHOTOS,
  MAX_PUBLIC_DESCRIPTION,
  OPERATION_LABELS,
  numberToInput,
  parseArea,
  COORDINATE_LABELS,
  parseCoordinate,
  parseListingPrice,
  parseWholeNumber,
} from "@/lib/properties"
import {
  useCreateProperty,
  useUpdateProperty,
  useUploadPropertyPhotos,
} from "@/lib/properties-api"
import { loadDraft, removeDraft, saveDraft } from "@/lib/form-draft"

import { AppraisalSheet } from "./[id]/appraisal-sheet"

const countField = (max: number) =>
  z
    .string()
    .refine(
      (value) => parseWholeNumber(value, max).ok,
      `Ingresá un número entero de 0 a ${max}.`
    )
const areaField = z
  .string()
  .refine(
    (value) => parseArea(value).ok,
    "Ingresá los m² con hasta 2 decimales."
  )

const coordinateField = (kind: "latitude" | "longitude") =>
  z
    .string()
    .refine(
      (value) => parseCoordinate(value, kind).ok,
      kind === "latitude"
        ? "La latitud va entre -90 y 90, con hasta 6 decimales (por ejemplo -34,6037)."
        : "La longitud va entre -180 y 180, con hasta 6 decimales (por ejemplo -58,3816)."
    )

const schema = z
  .object({
    address: z.string().trim().min(1, "Ingresá la dirección.").max(200),
    locationId: z.string().min(1, "Elegí al menos la localidad."),
    propertyTypeId: z.string().min(1, "Elegí el tipo de propiedad."),
    ownerId: z.string().nullable(),
    amenityIds: z.array(z.string()),
    notes: z.string().max(5000),
    listingOperation: z.enum(["RENT", "SALE"]),
    listingPrice: z
      .string()
      .refine(
        (value) => parseListingPrice(value).ok,
        "Ingresá un precio válido, por ejemplo 150000 o 150.000,50."
      ),
    listingCurrency: z.enum(["ARS", "USD"]),
    publicDescription: z.string().max(MAX_PUBLIC_DESCRIPTION),
    rooms: countField(LISTING_LIMITS.count.max),
    bedrooms: countField(LISTING_LIMITS.count.max),
    bathrooms: countField(LISTING_LIMITS.count.max),
    totalAreaM2: areaField,
    coveredAreaM2: areaField,
    ageYears: countField(LISTING_LIMITS.ageYears.max),
    latitude: coordinateField("latitude"),
    longitude: coordinateField("longitude"),
  })
  .superRefine((values, ctx) => {
    // El sitio público solo muestra el mapa con las dos coordenadas.
    const hasLatitude = values.latitude.trim() !== ""
    const hasLongitude = values.longitude.trim() !== ""
    if (hasLatitude && !hasLongitude) {
      ctx.addIssue({
        code: "custom",
        path: ["longitude"],
        message: "Cargá también la longitud: el mapa necesita las dos.",
      })
    }
    if (hasLongitude && !hasLatitude) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Cargá también la latitud: el mapa necesita las dos.",
      })
    }
  })

type FormValues = z.infer<typeof schema>

const STEPS = [
  { title: "Datos", fields: ["address", "locationId", "propertyTypeId"] },
  { title: "Propietario", fields: ["ownerId"] },
  { title: "Amenities", fields: ["amenityIds", "notes"] },
  {
    title: "Publicación",
    fields: [
      "listingOperation",
      "listingPrice",
      "listingCurrency",
      "publicDescription",
      "rooms",
      "bedrooms",
      "bathrooms",
      "totalAreaM2",
      "coveredAreaM2",
      "ageYears",
      "latitude",
      "longitude",
    ],
  },
  { title: "Fotos", fields: [] },
] as const

/** Borrador del alta en el navegador (spec 5.3). Sólo datos, no fotos. */
const DRAFT_OMIT = ["notes"]

/**
 * Un borrador está a medio cargar: se validan los tipos, no las reglas del
 * formulario (con ellas, cualquier campo vacío lo descartaría).
 */
const draftSchema = z
  .object({
    address: z.string(),
    locationId: z.string(),
    propertyTypeId: z.string(),
    ownerId: z.string().nullable(),
    amenityIds: z.array(z.string()),
    notes: z.string(),
    listingOperation: z.enum(["RENT", "SALE"]),
    listingPrice: z.string(),
    listingCurrency: z.enum(["ARS", "USD"]),
    publicDescription: z.string(),
    rooms: z.string(),
    bedrooms: z.string(),
    bathrooms: z.string(),
    totalAreaM2: z.string(),
    coveredAreaM2: z.string(),
    ageYears: z.string(),
    latitude: z.string(),
    longitude: z.string(),
  })
  .partial()

const EMPTY: FormValues = {
  address: "",
  locationId: "",
  propertyTypeId: "",
  ownerId: null,
  amenityIds: [],
  notes: "",
  listingOperation: "RENT",
  listingPrice: "",
  listingCurrency: "ARS",
  publicDescription: "",
  rooms: "",
  bedrooms: "",
  bathrooms: "",
  totalAreaM2: "",
  coveredAreaM2: "",
  ageYears: "",
  latitude: "",
  longitude: "",
}

/**
 * Campos de publicación para la API. Al editar, un campo vacío se manda como
 * `null` (así se borra); al crear, simplemente se omite.
 */
export function listingBody(data: FormValues, editing: boolean) {
  const clear = editing ? null : undefined
  const count = (input: string, max: number) => {
    const parsed = parseWholeNumber(input, max)
    return (parsed.ok ? parsed.value : null) ?? clear
  }
  const area = (input: string) => {
    const parsed = parseArea(input)
    return (parsed.ok ? parsed.value : null) ?? clear
  }
  const coordinate = (input: string, kind: "latitude" | "longitude") => {
    const parsed = parseCoordinate(input, kind)
    return (parsed.ok ? parsed.value : null) ?? clear
  }
  const price = parseListingPrice(data.listingPrice)
  const countMax = LISTING_LIMITS.count.max
  return {
    listingOperation: data.listingOperation,
    listingPrice: (price.ok ? price.value : null) ?? clear,
    listingCurrency: data.listingCurrency,
    publicDescription: data.publicDescription.trim() || clear,
    rooms: count(data.rooms, countMax),
    bedrooms: count(data.bedrooms, countMax),
    bathrooms: count(data.bathrooms, countMax),
    totalAreaM2: area(data.totalAreaM2),
    coveredAreaM2: area(data.coveredAreaM2),
    ageYears: count(data.ageYears, LISTING_LIMITS.ageYears.max),
    latitude: coordinate(data.latitude, "latitude"),
    longitude: coordinate(data.longitude, "longitude"),
  }
}

function readDraft(key: string | null): FormValues | null {
  if (!key) return null
  try {
    const raw = loadDraft(key)
    if (!raw) return null
    const parsed = draftSchema.safeParse(raw)
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
  const draftKey = useDraftKey("property")
  const router = useRouter()
  const editing = property !== undefined
  const steps = editing ? STEPS.slice(0, 4) : STEPS
  const [step, setStep] = React.useState(0)
  const [photos, setPhotos] = React.useState<File[]>([])
  const [error, setError] = React.useState<string | null>(null)
  // El formulario solo se renderiza en el navegador (detrás de SessionGate),
  // así que el borrador se lee al montar, sin un efecto.
  const [initialDraft] = React.useState(() =>
    editing || typeof window === "undefined" ? null : readDraft(draftKey)
  )
  const [draftRestored, setDraftRestored] = React.useState(
    initialDraft !== null
  )

  const create = useCreateProperty()
  const update = useUpdateProperty()
  const upload = useUploadPropertyPhotos()
  const [appraising, setAppraising] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: property
      ? {
          address: property.address,
          locationId: property.locationId,
          propertyTypeId: property.propertyTypeId,
          ownerId: property.ownerId,
          amenityIds: property.amenityIds,
          notes: property.notes ?? "",
          listingOperation: property.listingOperation,
          listingPrice: property.listingPrice ?? "",
          listingCurrency: property.listingCurrency,
          publicDescription: property.publicDescription ?? "",
          rooms: numberToInput(property.rooms),
          bedrooms: numberToInput(property.bedrooms),
          bathrooms: numberToInput(property.bathrooms),
          totalAreaM2: numberToInput(property.totalAreaM2),
          coveredAreaM2: numberToInput(property.coveredAreaM2),
          ageYears: numberToInput(property.ageYears),
          latitude: numberToInput(property.latitude),
          longitude: numberToInput(property.longitude),
        }
      : (initialDraft ?? EMPTY),
  })

  // «Usar este precio» desde la ficha llega con ?precio=…&moneda=…: se
  // precarga en el formulario, sin guardar.
  React.useEffect(() => {
    if (!editing) return
    const params = new URLSearchParams(window.location.search)
    const price = params.get("precio")
    const currency = params.get("moneda")
    if (price && /^\d+(\.\d{1,2})?$/.test(price)) {
      form.setValue("listingPrice", price, { shouldDirty: true })
      if (currency === "ARS" || currency === "USD") {
        form.setValue("listingCurrency", currency, { shouldDirty: true })
      }
    }
  }, [editing, form])

  const values = useWatch({ control: form.control })
  React.useEffect(() => {
    if (editing) return
    if (!draftKey) return
    // Las notas internas no se guardan en el navegador.
    saveDraft(draftKey, values, DRAFT_OMIT)
  }, [editing, values, draftKey])

  function discardDraft() {
    if (draftKey) removeDraft(draftKey)
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
      ownerId: data.ownerId,
      amenityIds: data.amenityIds,
      notes: data.notes.trim() || null,
      ...listingBody(data, editing),
    }
    try {
      const saved = editing
        ? await update.mutateAsync({ id: property.id, ...body })
        : await create.mutateAsync(body)

      if (!editing) {
        if (draftKey) removeDraft(draftKey)
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
        <h1 className="font-display text-title-lg font-semibold md:text-display-md">
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

        <FieldGroup className={step === 1 ? "" : "hidden"}>
          <Controller
            name="ownerId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="property-owner">Propietario</FieldLabel>
                <OwnerSelect
                  id="property-owner"
                  value={field.value}
                  selectedLabel={
                    property?.ownerId === field.value
                      ? property?.owner?.fullName
                      : undefined
                  }
                  onChange={(id) => field.onChange(id)}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Se puede dejar sin propietario y asignarlo después.{" "}
                  <Link href="/propietarios/nuevo" className="underline">
                    Cargar un propietario nuevo
                  </Link>
                  .
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

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
                  Solo las ve la inmobiliaria: nunca salen en el portal.
                </FieldDescription>
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup className={step === 3 ? "" : "hidden"}>
          <ListingStep
            form={form}
            editing={editing}
            onSuggest={property ? () => setAppraising(true) : undefined}
          />
        </FieldGroup>

        {step === 4 && !editing && (
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
      {property && (
        <AppraisalSheet
          propertyId={property.id}
          locationId={property.locationId}
          open={appraising}
          onOpenChange={setAppraising}
          onUse={(price, currency) => {
            form.setValue("listingPrice", price, {
              shouldDirty: true,
              shouldValidate: true,
            })
            form.setValue("listingCurrency", currency, { shouldDirty: true })
          }}
        />
      )}
    </div>
  )
}

type FormApi = ReturnType<typeof useForm<FormValues>>

const COUNT_FIELDS = [
  { name: "rooms", label: "Ambientes" },
  { name: "bedrooms", label: "Dormitorios" },
  { name: "bathrooms", label: "Baños" },
] as const

const AREA_FIELDS = [
  { name: "totalAreaM2", label: "Superficie total (m²)" },
  { name: "coveredAreaM2", label: "Superficie cubierta (m²)" },
] as const

const COORDINATE_FIELDS = ["latitude", "longitude"] as const

/** Paso 4: operación, precio y características que ve el público. */
function ListingStep({
  form,
  editing,
  onSuggest,
}: {
  form: FormApi
  editing: boolean
  onSuggest?: () => void
}) {
  return (
    <>
      <Controller
        name="listingOperation"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Operación</FieldLabel>
            <div
              role="radiogroup"
              aria-label="Operación"
              className="grid grid-cols-2 gap-2"
            >
              {(["RENT", "SALE"] as const).map((operation) => (
                <Button
                  key={operation}
                  type="button"
                  role="radio"
                  aria-checked={field.value === operation}
                  variant={field.value === operation ? "default" : "outline"}
                  className="min-h-11"
                  onClick={() => field.onChange(operation)}
                >
                  {OPERATION_LABELS[operation]}
                </Button>
              ))}
            </div>
          </Field>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Controller
          name="listingPrice"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="property-price">Precio</FieldLabel>
              <Input
                {...field}
                id="property-price"
                inputMode="decimal"
                placeholder="Consultar"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                Sin precio, el público ve «Consultar».
                {!editing &&
                  " Después de guardar la propiedad podés pedir un precio sugerido."}
              </FieldDescription>
              {onSuggest && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSuggest}
                  >
                    <Calculator aria-hidden />
                    Sugerir precio
                  </Button>
                </div>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="listingCurrency"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="property-currency">Moneda</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="property-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["ARS", "USD"] as const).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CURRENCY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>
      <Controller
        name="publicDescription"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="property-public-description">
              Descripción pública
            </FieldLabel>
            <Textarea {...field} id="property-public-description" rows={4} />
            <FieldDescription>
              Es el texto que ve el público en el portal y en el sitio web.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {COUNT_FIELDS.map(({ name, label }) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`property-${name}`}>{label}</FieldLabel>
                <Input
                  {...field}
                  id={`property-${name}`}
                  inputMode="numeric"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {AREA_FIELDS.map(({ name, label }) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`property-${name}`}>{label}</FieldLabel>
                <Input
                  {...field}
                  id={`property-${name}`}
                  inputMode="decimal"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
        <Controller
          name="ageYears"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="property-age">Antigüedad (años)</FieldLabel>
              <Input
                {...field}
                id="property-age"
                inputMode="numeric"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">
          Ubicación en el mapa (opcional)
        </legend>
        <p
          id="property-coordinates-help"
          className="text-sm text-muted-foreground"
        >
          El sitio público muestra el mapa con las coordenadas redondeadas a
          unos 100 m de precisión: se ve la zona, no la puerta. Se cargan las
          dos o ninguna. Podés copiarlas del botón derecho en Google Maps o
          OpenStreetMap.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {COORDINATE_FIELDS.map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`property-${name}`}>
                    {COORDINATE_LABELS[name]}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`property-${name}`}
                    inputMode="decimal"
                    placeholder={name === "latitude" ? "-34,6037" : "-58,3816"}
                    aria-invalid={fieldState.invalid}
                    aria-describedby="property-coordinates-help"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          ))}
        </div>
      </fieldset>
    </>
  )
}

/** Paso 5: fotos con vista previa. Se suben al crear la propiedad. */
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
    const { accepted, oversized } = splitOversizedPhotos(images)
    if (oversized.length > 0) {
      toast.error(OVERSIZED_PHOTO_MESSAGE(oversized.length))
    }
    const next = [...files, ...accepted].slice(0, MAX_PHOTOS)
    if (files.length + accepted.length > MAX_PHOTOS) {
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
