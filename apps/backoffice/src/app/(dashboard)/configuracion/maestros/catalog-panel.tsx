"use client"

import * as React from "react"
import { Pencil, Plus, Tag } from "lucide-react"
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { CatalogItem, CatalogKey } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Switch } from "@adminprop/ui/components/switch"

import { CATALOGS } from "@/lib/master-data"
import {
  useCatalog,
  useSaveCatalogItem,
  useSetCatalogItemActive,
} from "@/lib/master-data-api"

import { NameDialog } from "./name-dialog"

const KNOWN_ICONS = new Set<string>(iconNames)

/** Ícono de una amenity; uno genérico si no tiene o no existe en lucide. */
export function AmenityIcon({ name }: { name: string | null }) {
  if (name && KNOWN_ICONS.has(name)) {
    return (
      <DynamicIcon
        name={name as IconName}
        aria-hidden
        className="size-4 text-muted-foreground"
      />
    )
  }
  return <Tag aria-hidden className="size-4 text-muted-foreground" />
}

/**
 * Un maestro plano: listado con toggle de activo y alta rápida (spec Fase 5,
 * 6). Los empleados lo ven, pero sólo un admin lo cambia.
 */
export function CatalogPanel({
  catalog,
  canEdit,
}: {
  catalog: CatalogKey
  canEdit: boolean
}) {
  const meta = CATALOGS[catalog]
  const items = useCatalog(catalog, "all")
  const save = useSaveCatalogItem(catalog)
  const setActive = useSetCatalogItemActive(catalog)
  const [dialog, setDialog] = React.useState<{
    key: number
    item: CatalogItem | null
  } | null>(null)

  async function toggle(item: CatalogItem, active: boolean) {
    try {
      await setActive.mutateAsync({ id: item.id, active })
      toast.success(
        active
          ? `"${item.name}" vuelve a aparecer en los selectores.`
          : `"${item.name}" ya no aparece en los selectores. Lo que ya lo usa lo sigue mostrando.`
      )
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo cambiar el estado."))
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-label={meta.title}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.data
            ? `${items.data.filter((i) => i.isActive).length} activos de ${items.data.length}`
            : " "}
        </p>
        {canEdit && (
          <Button onClick={() => setDialog({ key: Date.now(), item: null })}>
            <Plus aria-hidden />
            Agregar
          </Button>
        )}
      </div>

      {items.isPending ? (
        <PageSkeleton cards={2} />
      ) : items.isError ? (
        <EmptyState
          title="No se pudo cargar"
          description={apiErrorMessage(
            items.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void items.refetch()}>Reintentar</Button>
          }
        />
      ) : items.data.length === 0 ? (
        <EmptyState
          title={`Todavía no hay ${meta.title.toLowerCase()}`}
          description={canEdit ? "Agregá el primero." : undefined}
        />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.data.map((item) => (
            <li
              key={item.id}
              className="flex min-h-14 items-center gap-3 px-4 py-2"
            >
              {meta.hasIcon && <AmenityIcon name={item.icon} />}
              <span
                className={
                  item.isActive ? "flex-1" : "flex-1 text-muted-foreground"
                }
              >
                {item.name}
              </span>
              {!item.isActive && <Badge variant="borrador">Desactivado</Badge>}
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${item.name}`}
                    onClick={() => setDialog({ key: Date.now(), item })}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(active) => void toggle(item, active)}
                    aria-label={`${item.name}: ${item.isActive ? "activo" : "desactivado"}`}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <NameDialog
          key={dialog.key}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title={
            dialog.item ? `Editar ${meta.singular}` : `Nuevo ${meta.singular}`
          }
          initial={dialog.item ?? undefined}
          withIcon={meta.hasIcon}
          submitLabel={dialog.item ? "Guardar" : "Agregar"}
          onSubmit={async ({ name, icon }) => {
            await save.mutateAsync({
              id: dialog.item?.id,
              name,
              ...(meta.hasIcon ? { icon } : {}),
            })
            toast.success(dialog.item ? "Guardado." : `"${name}" agregado.`)
          }}
        />
      )}
    </section>
  )
}
