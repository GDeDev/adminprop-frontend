"use client"

import * as React from "react"
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { Textarea } from "@adminprop/ui/components/textarea"
import { cn } from "@adminprop/ui/lib/utils"

import { useUploadSiteAsset } from "@/lib/site-api"
import { moveItem, removeItem } from "@/lib/site"

/* ------------------------------------------------------------------ */
/* Errores por campo (422) compartidos con todos los inputs             */
/* ------------------------------------------------------------------ */

interface FieldErrorsValue {
  errors: Record<string, string>
  /** Borra los errores de `prefix` y de todo lo que cuelga de él. */
  clear: (prefix: string) => void
}

const FieldErrorsContext = React.createContext<FieldErrorsValue>({
  errors: {},
  clear: () => {},
})

export const FieldErrorsProvider = FieldErrorsContext.Provider

export function useFieldError(path: string): string | undefined {
  return React.useContext(FieldErrorsContext).errors[path]
}

export function useClearError() {
  return React.useContext(FieldErrorsContext).clear
}

export function fieldId(path: string): string {
  return `site-${path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/-$/, "")}`
}

/* ------------------------------------------------------------------ */
/* Texto                                                                */
/* ------------------------------------------------------------------ */

function Counter({ length, limit }: { length: number; limit: number }) {
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        length > limit
          ? "font-medium text-destructive"
          : "text-muted-foreground"
      )}
    >
      {length}/{limit}
      <span className="sr-only"> caracteres</span>
    </span>
  )
}

export function SiteTextField({
  path,
  label,
  value,
  onChange,
  limit,
  multiline = false,
  nullable = false,
  description,
  placeholder,
  inputMode,
  rows = 3,
}: {
  path: string
  label: string
  value: string | null
  onChange: (value: string | null) => void
  limit?: number
  multiline?: boolean
  /** Un campo vacío se guarda como `null`. */
  nullable?: boolean
  description?: React.ReactNode
  placeholder?: string
  inputMode?: React.ComponentProps<"input">["inputMode"]
  rows?: number
}) {
  const clear = useClearError()
  const error = useFieldError(path)
  const id = fieldId(path)
  const text = value ?? ""
  const describedBy = [
    description ? `${id}-description` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ")

  function handle(next: string) {
    clear(path)
    onChange(next === "" && nullable ? null : next)
  }

  const common = {
    id,
    value: text,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {limit !== undefined && <Counter length={text.length} limit={limit} />}
      </div>
      {multiline ? (
        <Textarea
          {...common}
          rows={rows}
          onChange={(event) => handle(event.target.value)}
        />
      ) : (
        <Input
          {...common}
          inputMode={inputMode}
          autoComplete="off"
          onChange={(event) => handle(event.target.value)}
        />
      )}
      {description && (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      )}
      {error && <FieldError id={`${id}-error`} errors={[{ message: error }]} />}
    </Field>
  )
}

/* ------------------------------------------------------------------ */
/* Select nativo                                                        */
/* ------------------------------------------------------------------ */

export const SELECT_CLASS =
  "h-11 w-full rounded-md border bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive md:h-9"

export function SiteSelectField<T extends string>({
  path,
  label,
  value,
  options,
  onChange,
  description,
}: {
  path: string
  label: string
  value: T
  options: readonly { key: T; label: string }[]
  onChange: (value: T) => void
  description?: React.ReactNode
}) {
  const clear = useClearError()
  const error = useFieldError(path)
  const id = fieldId(path)

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        className={SELECT_CLASS}
        onChange={(event) => {
          clear(path)
          onChange(event.target.value as T)
        }}
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}

/* ------------------------------------------------------------------ */
/* Imagen                                                               */
/* ------------------------------------------------------------------ */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

/** Subida de una imagen a `POST /site/assets`, con vista previa y quitar. */
export function ImageField({
  path,
  label,
  value,
  onChange,
  description,
}: {
  path: string
  label: string
  value: string | null
  onChange: (url: string | null) => void
  description?: React.ReactNode
}) {
  const upload = useUploadSiteAsset()
  const clear = useClearError()
  const error = useFieldError(path)
  const id = fieldId(path)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function pick(file: File | undefined) {
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("La imagen tiene que ser JPG, PNG o WebP.")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("La imagen pesa más de 5 MB. Probá con una más liviana.")
      return
    }
    try {
      const asset = await upload.mutateAsync(file)
      clear(path)
      onChange(asset.url)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo subir la imagen."))
    }
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={`Vista previa: ${label}`}
            className="h-20 w-32 rounded-md border bg-muted object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed text-muted-foreground"
          >
            <ImagePlus className="size-6" />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <ImagePlus aria-hidden />
            )}
            {upload.isPending
              ? "Subiendo…"
              : value
                ? "Cambiar imagen"
                : "Subir imagen"}
            <span className="sr-only">: {label}</span>
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                clear(path)
                onChange(null)
              }}
            >
              <Trash2 aria-hidden />
              Quitar
              <span className="sr-only">: {label}</span>
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          tabIndex={-1}
          aria-label={`Archivo: ${label}`}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            void pick(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </div>
      <FieldDescription>
        {description ?? "JPG, PNG o WebP, hasta 5 MB."}
      </FieldDescription>
      {error && <FieldError errors={[{ message: error }]} />}
    </Field>
  )
}

/* ------------------------------------------------------------------ */
/* Listas                                                               */
/* ------------------------------------------------------------------ */

/**
 * Lista editable con agregar, quitar y mover. `path` es el bloque
 * (`content.faqs`): un error a nivel de lista se muestra arriba y cualquier
 * cambio estructural limpia los errores por posición, que quedarían viejos.
 */
export function ListEditor<T>({
  path,
  items,
  onChange,
  max,
  itemLabel,
  addLabel,
  emptyText,
  makeItem,
  renderItem,
}: {
  path: string
  items: T[]
  onChange: (items: T[]) => void
  max: number
  /** "Pregunta" → "Pregunta 3". */
  itemLabel: string
  addLabel: string
  emptyText: string
  makeItem: () => T
  renderItem: (
    item: T,
    index: number,
    update: (item: T) => void
  ) => React.ReactNode
}) {
  const clear = useClearError()
  const error = useFieldError(path)

  function change(next: T[]) {
    clear(path)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <FieldError errors={[{ message: error }]} />}
      {items.length === 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li
            key={index}
            aria-label={`${itemLabel} ${index + 1}`}
            className="flex flex-col gap-3 rounded-lg border bg-card p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {itemLabel} {index + 1}
              </span>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Subir ${itemLabel.toLowerCase()} ${index + 1}`}
                  disabled={index === 0}
                  onClick={() => change(moveItem(items, index, index - 1))}
                >
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Bajar ${itemLabel.toLowerCase()} ${index + 1}`}
                  disabled={index === items.length - 1}
                  onClick={() => change(moveItem(items, index, index + 1))}
                >
                  <ArrowDown aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${itemLabel.toLowerCase()} ${index + 1}`}
                  onClick={() => change(removeItem(items, index))}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </div>
            {renderItem(item, index, (updated) =>
              onChange(
                items.map((current, i) => (i === index ? updated : current))
              )
            )}
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={items.length >= max}
          onClick={() => change([...items, makeItem()])}
        >
          <Plus aria-hidden />
          {addLabel}
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} de {max}
        </span>
      </div>
    </div>
  )
}
