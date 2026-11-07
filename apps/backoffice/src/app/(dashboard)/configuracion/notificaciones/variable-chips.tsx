"use client"

import * as React from "react"

import { Button } from "@adminprop/ui/components/button"

import { insertVariable } from "@/lib/notifications"

/**
 * Inserta variables en un textarea controlado, donde está el cursor. Si la
 * persona todavía no tocó el campo, las agrega al final.
 */
export function useVariableInsert(
  areaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  setValue: (next: string) => void
) {
  const touched = React.useRef(false)

  const insert = (name: string) => {
    const area = areaRef.current
    const start = touched.current
      ? (area?.selectionStart ?? value.length)
      : value.length
    const end = touched.current
      ? (area?.selectionEnd ?? value.length)
      : value.length
    const next = insertVariable(value, name, start, end)
    setValue(next.text)
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(next.cursor, next.cursor)
    })
  }
  const markTouched = () => {
    touched.current = true
  }

  return [insert, markTouched] as const
}

/** Chips que insertan `{{variable}}` en el texto, en la posición del cursor. */
export function VariableChips({
  variables,
  onInsert,
  disabled,
}: {
  variables: { name: string; label: string; example?: string }[]
  onInsert: (name: string) => void
  disabled?: boolean
}) {
  return (
    <div role="group" aria-label="Variables" className="flex flex-wrap gap-2">
      {variables.map((variable) => (
        <Button
          key={variable.name}
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-full"
          disabled={disabled}
          title={
            variable.example
              ? `${variable.label} · ej.: ${variable.example}`
              : variable.label
          }
          onClick={() => onInsert(variable.name)}
        >
          {variable.label}
        </Button>
      ))}
    </div>
  )
}
