"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Camera, ChevronLeft, Plus, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  InventoryDetail,
  InventoryItem,
  ItemCondition,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Checkbox } from "@adminprop/ui/components/checkbox"
import { ConfirmDialog } from "@adminprop/ui/components/confirm-dialog"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Textarea } from "@adminprop/ui/components/textarea"

import { formatDate } from "@/lib/dates"
import {
  CONDITIONS,
  CONDITION_LABELS,
  groupByCategory,
  INVENTORY_STATUS_META,
  INVENTORY_TYPE_LABELS,
  poorWithoutPhotos,
} from "@/lib/inventory"
import {
  useConfirmInventory,
  useCorrectInventory,
  useDeleteInventoryPhoto,
  useInventory,
  useUpdateInventory,
  useUploadItemPhotos,
} from "@/lib/inventory-api"
import { OVERSIZED_PHOTO_MESSAGE, splitOversizedPhotos } from "@/lib/photos"

/** Ítem en edición: `id` vacío mientras no se guardó. */
interface DraftItem {
  key: string
  id?: string
  category: string
  description: string
  condition: ItemCondition
  notes: string
}

function toDraft(item: InventoryItem): DraftItem {
  return {
    key: item.id,
    id: item.id,
    category: item.category,
    description: item.description,
    condition: item.condition,
    notes: item.notes ?? "",
  }
}

/**
 * Checklist guiado por categoría (spec Fase 25, 5.1): estado, observaciones y
 * fotos de cada ítem, pensado para el celular. Un inventario confirmado es
 * de sólo lectura; para corregirlo se crea uno nuevo con motivo.
 */
export function InventoryEditor({
  contractId,
  inventoryId,
}: {
  contractId: string
  inventoryId: string
}) {
  const query = useInventory(inventoryId)
  if (query.isPending) return <PageSkeleton />
  if (query.isError) {
    return (
      <EmptyState
        title="No se encontró el inventario"
        description="Puede que lo hayan reemplazado por una corrección."
      />
    )
  }
  return <Editor contractId={contractId} detail={query.data} />
}

function Editor({
  contractId,
  detail,
}: {
  contractId: string
  detail: InventoryDetail
}) {
  const router = useRouter()
  const locked = detail.status === "CONFIRMED"
  const update = useUpdateInventory()
  const confirm = useConfirmInventory()
  const correct = useCorrectInventory()
  const upload = useUploadItemPhotos()
  const removePhoto = useDeleteInventoryPhoto()
  // Confirmar el inventario es irreversible: siempre se pregunta, y si hay
  // ítems en mal estado sin foto se listan.
  const [confirming, setConfirming] = React.useState<string[] | null>(null)
  const [detaching, setDetaching] = React.useState<string | null>(null)

  const [items, setItems] = React.useState<DraftItem[]>(() =>
    detail.items.map(toDraft)
  )
  const [generalNotes, setGeneralNotes] = React.useState(
    detail.generalNotes ?? ""
  )
  const [date, setDate] = React.useState(detail.date)
  const [acknowledged, setAcknowledged] = React.useState(
    detail.tenantAcknowledged
  )
  const [correctionReason, setCorrectionReason] = React.useState("")
  const [showCorrection, setShowCorrection] = React.useState(false)

  const photosById = new Map(detail.items.map((item) => [item.id, item.photos]))
  const status = INVENTORY_STATUS_META[detail.status]

  function patchItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item))
    )
  }

  function addItem(category: string) {
    setItems((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        category,
        description: "",
        condition: "GOOD",
        notes: "",
      },
    ])
  }

  async function save(): Promise<InventoryDetail | null> {
    if (items.some((item) => item.description.trim() === "")) {
      toast.error("Todos los ítems necesitan una descripción.")
      return null
    }
    try {
      const saved = await update.mutateAsync({
        id: detail.id,
        date,
        generalNotes: generalNotes.trim() || null,
        tenantAcknowledged: acknowledged,
        items: items.map((item) => ({
          id: item.id,
          category: item.category,
          description: item.description.trim(),
          condition: item.condition,
          notes: item.notes.trim() || null,
        })),
      })
      setItems(saved.items.map(toDraft))
      return saved
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo guardar el inventario."))
      return null
    }
  }

  async function saveDraft() {
    if (await save()) toast.success("Borrador guardado.")
  }

  async function askToConfirm() {
    const saved = await save()
    if (!saved) return
    setConfirming(poorWithoutPhotos(saved))
  }

  async function confirmInventory() {
    try {
      await confirm.mutateAsync(detail.id)
      toast.success("Inventario confirmado. Ya no se puede editar.")
      setConfirming(null)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo confirmar el inventario."))
      setConfirming(null)
    }
  }

  async function attach(itemId: string, files: FileList | null) {
    if (!files || files.length === 0) return
    const { accepted, oversized } = splitOversizedPhotos([...files])
    if (oversized.length > 0) {
      toast.error(OVERSIZED_PHOTO_MESSAGE(oversized.length))
    }
    if (accepted.length === 0) return
    try {
      await upload.mutateAsync({
        inventoryId: detail.id,
        itemId,
        files: accepted,
      })
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudieron subir las fotos."))
    }
  }

  async function detach(photoId: string) {
    try {
      await removePhoto.mutateAsync({ inventoryId: detail.id, photoId })
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo quitar la foto del ítem."))
    }
    setDetaching(null)
  }

  async function startCorrection() {
    if (correctionReason.trim().length < 3) {
      toast.error("Contá por qué se corrige.")
      return
    }
    try {
      const draft = await correct.mutateAsync({
        id: detail.id,
        reason: correctionReason.trim(),
      })
      router.push(`/contratos/${contractId}/inventario/${draft.id}`)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo iniciar la corrección."))
    }
  }

  const groups = groupByCategory(items)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/contratos/${contractId}`}>
            <ChevronLeft aria-hidden />
            Contrato
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {INVENTORY_TYPE_LABELS[detail.type]}
          </h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {detail.correctionReason && (
          <p className="text-sm text-muted-foreground">
            Corrección: {detail.correctionReason}
          </p>
        )}
        {locked && detail.confirmedAt && (
          <p className="text-sm text-muted-foreground">
            Confirmado el {formatDate(detail.confirmedAt.slice(0, 10))}
            {detail.performedBy && ` por ${detail.performedBy.fullName}`}.
          </p>
        )}
      </div>

      {locked && (
        <Alert>
          <AlertDescription>
            Este inventario está confirmado y sirve de respaldo: no se puede
            editar. Si hay un error, se hace uno nuevo que lo corrige y deja el
            motivo.
          </AlertDescription>
        </Alert>
      )}

      <label className="flex max-w-xs flex-col gap-1 text-sm">
        Fecha
        <Input
          type="date"
          value={date}
          disabled={locked}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>

      {groups.map(([category, categoryItems]) => (
        <section
          key={category}
          className="rounded-xl border bg-card p-4"
          aria-label={category}
        >
          <h2 className="mb-3 font-display text-lg font-semibold">
            {category}
          </h2>
          <ul className="flex flex-col gap-4">
            {categoryItems.map((item) => {
              const photos = item.id ? (photosById.get(item.id) ?? []) : []
              return (
                <li key={item.key} className="flex flex-col gap-2">
                  {locked || item.id ? (
                    <p className="font-medium">{item.description}</p>
                  ) : (
                    <Input
                      aria-label="Descripción del ítem"
                      placeholder="Ítem (ej. Heladera)"
                      value={item.description}
                      onChange={(event) =>
                        patchItem(item.key, { description: event.target.value })
                      }
                    />
                  )}
                  <div
                    role="radiogroup"
                    aria-label={`Estado de ${item.description || "ítem nuevo"}`}
                    className="flex flex-wrap gap-2"
                  >
                    {CONDITIONS.map((condition) => (
                      <Button
                        key={condition}
                        type="button"
                        size="sm"
                        role="radio"
                        aria-checked={item.condition === condition}
                        variant={
                          item.condition === condition ? "default" : "outline"
                        }
                        disabled={locked}
                        onClick={() => patchItem(item.key, { condition })}
                      >
                        {CONDITION_LABELS[condition]}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    aria-label={`Observaciones de ${item.description || "ítem nuevo"}`}
                    placeholder="Observaciones"
                    rows={2}
                    value={item.notes}
                    disabled={locked}
                    onChange={(event) =>
                      patchItem(item.key, { notes: event.target.value })
                    }
                  />
                  {item.condition === "POOR" && photos.length === 0 && (
                    <p className="flex items-center gap-1 text-sm font-medium text-destructive">
                      <TriangleAlert aria-hidden className="size-4" />
                      Se recomienda adjuntar foto para respaldo.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`Foto de ${item.description}`}
                          className="size-20 rounded-md object-cover"
                        />
                        {!locked && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon-sm"
                            className="absolute -top-2 -right-2"
                            aria-label="Quitar foto"
                            onClick={() => setDetaching(photo.id)}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        )}
                      </div>
                    ))}
                    {!locked &&
                      (item.id ? (
                        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm hover:bg-muted">
                          <Camera aria-hidden className="size-4" />
                          Agregar fotos
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="sr-only"
                            onChange={(event) => {
                              void attach(item.id!, event.target.files)
                              event.target.value = ""
                            }}
                          />
                        </label>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Guardá el borrador para adjuntar fotos.
                        </span>
                      ))}
                  </div>
                </li>
              )
            })}
          </ul>
          {!locked && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => addItem(category)}
            >
              <Plus aria-hidden />
              Agregar ítem
            </Button>
          )}
        </section>
      ))}

      <label className="flex flex-col gap-1 text-sm">
        Observaciones generales
        <Textarea
          rows={3}
          value={generalNotes}
          disabled={locked}
          onChange={(event) => setGeneralNotes(event.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={acknowledged}
          disabled={locked}
          onCheckedChange={(value) => setAcknowledged(value === true)}
        />
        El inquilino estuvo presente y está de acuerdo con este inventario.
      </label>

      {!locked ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void saveDraft()}
            disabled={update.isPending}
          >
            Guardar borrador
          </Button>
          <Button
            onClick={() => void askToConfirm()}
            disabled={update.isPending || confirm.isPending}
          >
            Confirmar inventario
          </Button>
        </div>
      ) : showCorrection ? (
        <div className="flex max-w-xl flex-col gap-2">
          <Textarea
            aria-label="Motivo de la corrección"
            placeholder="¿Por qué se corrige?"
            rows={2}
            value={correctionReason}
            onChange={(event) => setCorrectionReason(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => void startCorrection()}
              disabled={correct.isPending}
            >
              Crear corrección
            </Button>
            <Button variant="ghost" onClick={() => setShowCorrection(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="outline" onClick={() => setShowCorrection(true)}>
            Corregir con un inventario nuevo
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="¿Confirmar el inventario?"
        description="Una vez confirmado ya no se puede editar: si hay un error, se corrige con un inventario nuevo."
        confirmLabel={
          confirming && confirming.length > 0
            ? "Confirmar igual"
            : "Confirmar inventario"
        }
        destructive={false}
        pending={confirm.isPending}
        onConfirm={confirmInventory}
      >
        {confirming && confirming.length > 0 && (
          <Alert role="alert">
            <TriangleAlert aria-hidden />
            <AlertDescription>
              Hay ítems en mal estado sin foto: {confirming.join(", ")}. Se
              recomienda adjuntar una para respaldo.
            </AlertDescription>
          </Alert>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={detaching !== null}
        onOpenChange={(open) => !open && setDetaching(null)}
        title="¿Quitar la foto?"
        description="La foto se borra del inventario y no se puede recuperar."
        confirmLabel="Quitar foto"
        pending={removePhoto.isPending}
        onConfirm={() => (detaching ? detach(detaching) : undefined)}
      />
    </div>
  )
}
