"use client"

import { Button } from "@adminprop/ui/components/button"

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
