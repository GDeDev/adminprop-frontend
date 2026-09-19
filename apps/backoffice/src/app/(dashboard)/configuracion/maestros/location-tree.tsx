"use client"

import * as React from "react"
import { ChevronRight, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { LocationLevel, LocationNode } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Switch } from "@adminprop/ui/components/switch"
import { cn } from "@adminprop/ui/lib/utils"

import {
  CHILD_LEVEL,
  LEVEL_LABELS,
  NEW_LOCATION_TITLE,
} from "@/lib/master-data"
import {
  useCreateLocation,
  useLocationTree,
  useRenameLocation,
  useSetLocationActive,
} from "@/lib/master-data-api"

import { NameDialog } from "./name-dialog"

type DialogInput =
  | { mode: "create"; level: LocationLevel; parent: LocationNode | null }
  | { mode: "rename"; node: LocationNode }

/** `key` cambia en cada apertura: el diálogo se monta de nuevo y arranca limpio. */
type DialogState = DialogInput & { key: number }

interface TreeActions {
  canEdit: boolean
  expanded: Set<string>
  toggleExpanded: (id: string) => void
  openDialog: (state: DialogInput) => void
  setActive: (
    node: LocationNode,
    parent: LocationNode | null,
    active: boolean
  ) => void
}

/**
 * Ubicaciones como árbol expandible (spec Fase 5, 6). Arranca con los dos
 * primeros niveles abiertos: país y provincias.
 */
export function LocationTree({ canEdit }: { canEdit: boolean }) {
  const tree = useLocationTree("all")
  const createLocation = useCreateLocation()
  const renameLocation = useRenameLocation()
  const setLocationActive = useSetLocationActive()
  const [expanded, setExpanded] = React.useState<Set<string> | null>(null)
  const [dialog, setDialog] = React.useState<DialogState | null>(null)

  // Hasta que el usuario toque algo, los países quedan abiertos.
  const open = expanded ?? new Set(tree.data?.map((country) => country.id))

  const actions: TreeActions = {
    canEdit,
    expanded: open,
    toggleExpanded: (id) => {
      const next = new Set(open)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setExpanded(next)
    },
    openDialog: (state) => setDialog({ ...state, key: Date.now() }),
    setActive: async (node, parent, active) => {
      try {
        await setLocationActive.mutateAsync({ id: node.id, active })
        if (active && parent && !parent.isActive) {
          // Spec, casos borde: se permite, pero se avisa.
          toast.warning(
            `"${node.name}" quedó activa, pero "${parent.name}" sigue desactivada: no va a aparecer en los selectores hasta que la reactives.`
          )
        } else {
          toast.success(
            active
              ? `"${node.name}" reactivada.`
              : `"${node.name}" desactivada.`
          )
        }
      } catch (cause) {
        toast.error(apiErrorMessage(cause, "No se pudo cambiar el estado."))
      }
    },
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Ubicaciones">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          País → Provincia → Localidad → Barrio
        </p>
        {canEdit && (
          <Button
            variant="outline"
            onClick={() =>
              actions.openDialog({
                mode: "create",
                level: "COUNTRY",
                parent: null,
              })
            }
          >
            <Plus aria-hidden />
            País
          </Button>
        )}
      </div>

      {tree.isPending ? (
        <PageSkeleton cards={1} />
      ) : tree.isError ? (
        <EmptyState
          title="No se pudieron cargar las ubicaciones"
          description={apiErrorMessage(
            tree.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void tree.refetch()}>Reintentar</Button>
          }
        />
      ) : tree.data.length === 0 ? (
        <EmptyState
          title="Todavía no hay ubicaciones"
          description="Se cargan con la importación de Tokko, o agregá un país a mano."
        />
      ) : (
        <ul role="tree" className="rounded-xl border bg-card p-2">
          {tree.data.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              parent={null}
              depth={0}
              actions={actions}
            />
          ))}
        </ul>
      )}

      {dialog && (
        <NameDialog
          key={dialog.key}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
          title={
            dialog.mode === "rename"
              ? `Renombrar ${LEVEL_LABELS[dialog.node.level].toLowerCase()}`
              : NEW_LOCATION_TITLE[dialog.level]
          }
          description={
            dialog.mode === "create" && dialog.parent
              ? `Dentro de ${dialog.parent.name}.`
              : undefined
          }
          initial={dialog.mode === "rename" ? dialog.node : undefined}
          submitLabel={dialog.mode === "rename" ? "Guardar" : "Agregar"}
          onSubmit={async ({ name }) => {
            if (dialog.mode === "rename") {
              await renameLocation.mutateAsync({ id: dialog.node.id, name })
              toast.success("Guardado.")
              return
            }
            await createLocation.mutateAsync({
              level: dialog.level,
              name,
              parentId: dialog.parent?.id ?? null,
            })
            if (dialog.parent && !open.has(dialog.parent.id)) {
              actions.toggleExpanded(dialog.parent.id)
            }
            toast.success(`Se agregó "${name}".`)
          }}
        />
      )}
    </section>
  )
}

function TreeNode({
  node,
  parent,
  depth,
  actions,
}: {
  node: LocationNode
  parent: LocationNode | null
  depth: number
  actions: TreeActions
}) {
  const hasChildren = node.children.length > 0
  const isOpen = actions.expanded.has(node.id)
  const childLevel = CHILD_LEVEL[node.level]

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-selected={false}
    >
      <div
        className="flex min-h-11 items-center gap-2 rounded-md pr-1 hover:bg-muted"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={isOpen ? `Cerrar ${node.name}` : `Abrir ${node.name}`}
          disabled={!hasChildren}
          onClick={() => actions.toggleExpanded(node.id)}
          className={cn(!hasChildren && "invisible")}
        >
          <ChevronRight
            aria-hidden
            className={cn("transition-transform", isOpen && "rotate-90")}
          />
        </Button>
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !node.isActive && "text-muted-foreground"
          )}
        >
          {node.name}
          <span className="ml-2 text-xs text-muted-foreground">
            {LEVEL_LABELS[node.level]}
          </span>
        </span>
        {!node.isActive && <Badge variant="borrador">Desactivada</Badge>}
        {actions.canEdit && (
          <div className="flex shrink-0 items-center gap-1">
            {childLevel && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Agregar ${LEVEL_LABELS[childLevel].toLowerCase()} en ${node.name}`}
                title={`Agregar ${LEVEL_LABELS[childLevel].toLowerCase()}`}
                onClick={() =>
                  actions.openDialog({
                    mode: "create",
                    level: childLevel,
                    parent: node,
                  })
                }
              >
                <Plus aria-hidden />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Renombrar ${node.name}`}
              onClick={() => actions.openDialog({ mode: "rename", node })}
            >
              <Pencil aria-hidden />
            </Button>
            <Switch
              checked={node.isActive}
              onCheckedChange={(active) =>
                void actions.setActive(node, parent, active)
              }
              aria-label={`${node.name}: ${node.isActive ? "activa" : "desactivada"}`}
            />
          </div>
        )}
      </div>
      {hasChildren && isOpen && (
        <ul role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              parent={node}
              depth={depth + 1}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
