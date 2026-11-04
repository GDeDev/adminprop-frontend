"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@adminprop/ui/components/command"

export interface CommandPaletteItem {
  id: string
  label: string
  icon?: LucideIcon
  /** Palabras extra para buscar (sinónimos, códigos). */
  keywords?: string[]
  shortcut?: string
  onSelect: () => void
}

export interface CommandPaletteGroup {
  heading: string
  items: CommandPaletteItem[]
}

/**
 * Paleta de comandos (⌘K / Ctrl+K) sobre `cmdk`. Sirve para navegar y para
 * acciones rápidas; las apps arman los grupos (secciones, acciones,
 * recientes). Controlada con `open`/`onOpenChange` o sola.
 *
 * Reglas: cada ítem tiene que existir también en la navegación normal (la
 * paleta acelera, no es el único camino), y el texto de la UI va en español.
 */
function CommandPalette({
  groups,
  open: openProp,
  onOpenChange,
  hotkey = true,
  placeholder = "Buscar o ir a…",
  emptyText = "No encontramos resultados.",
  title = "Paleta de comandos",
  description = "Buscá una sección o una acción.",
}: {
  groups: CommandPaletteGroup[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Escucha ⌘K / Ctrl+K para abrir y cerrar. */
  hotkey?: boolean
  placeholder?: string
  emptyText?: string
  title?: string
  description?: string
}) {
  const [inner, setInner] = React.useState(false)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : inner

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!controlled) setInner(next)
      onOpenChange?.(next)
    },
    [controlled, onOpenChange]
  )

  React.useEffect(() => {
    if (!hotkey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [hotkey, open, setOpen])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      description={description}
      showCloseButton={false}
    >
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyText}</CommandEmpty>
        {groups.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${(item.keywords ?? []).join(" ")}`}
                  onSelect={() => {
                    setOpen(false)
                    item.onSelect()
                  }}
                >
                  {Icon && <Icon aria-hidden />}
                  {item.label}
                  {item.shortcut && (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export { CommandPalette }
