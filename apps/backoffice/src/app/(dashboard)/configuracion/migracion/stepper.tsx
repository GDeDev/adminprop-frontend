import { Check } from "lucide-react"

import type { BatchPhase } from "@/lib/migration"

export const STEPS = [
  "Origen",
  "Análisis",
  "Revisión",
  "Confirmar",
  "Resultado",
] as const

/** Paso (1 a 5) en el que está el lote; "Confirmar" es el diálogo de la revisión. */
export function currentStep(phase: BatchPhase, confirming = false): number {
  switch (phase) {
    case "analyzing":
      return 2
    case "review":
      return confirming ? 4 : 3
    default:
      return 5
  }
}

/** Pasos del flujo; en mobile sólo se nombra el actual para no apretar. */
export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Pasos de la migración">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, index) => {
          const step = index + 1
          const done = step < current
          const active = step === current
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <span
                className={
                  "flex size-6 items-center justify-center rounded-full border text-xs " +
                  (done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary text-primary"
                      : "text-muted-foreground")
                }
              >
                {done ? <Check aria-hidden className="size-3.5" /> : step}
                <span className="sr-only">
                  {done ? " (hecho) " : active ? " (actual) " : " "}
                  {label}
                </span>
              </span>
              <span
                aria-hidden
                className={
                  "text-sm " +
                  (active
                    ? "font-medium"
                    : "hidden text-muted-foreground md:inline")
                }
              >
                {label}
              </span>
              {step < STEPS.length && (
                <span
                  aria-hidden
                  className="hidden h-px w-4 bg-border md:block"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
