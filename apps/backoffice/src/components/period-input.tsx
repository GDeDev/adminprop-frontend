"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { capitalizeFirst } from "@adminprop/ui/lib/format"
import { cn } from "@adminprop/ui/lib/utils"

const PERIOD = /^(\d{4})-(0[1-9]|1[0-2])$/

const MONTHS = Array.from({ length: 12 }, (_, index) =>
  capitalizeFirst(
    new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" }).format(
      new Date(Date.UTC(2000, index, 1))
    )
  )
)

/**
 * Selector de mes (`AAAA-MM`) con un select de mes y otro de año. Reemplaza a
 * `<input type="month">`, que Firefox y Safari de escritorio no soportan (M-13),
 * y se ve igual en todos los navegadores.
 */
export function PeriodInput({
  value,
  onChange,
  label = "Mes",
  className,
}: {
  value: string
  onChange: (period: string) => void
  /** Nombre accesible; se usa como prefijo de los dos selects ("Mes", "Desde"). */
  label?: string
  className?: string
}) {
  const match = PERIOD.exec(value)
  const year = match ? Number(match[1]) : new Date().getFullYear()
  const month = match ? Number(match[2]) : new Date().getMonth() + 1
  const current = new Date().getFullYear()
  const first = Math.min(current - 6, year)
  const last = Math.max(current + 3, year)
  const years = Array.from({ length: last - first + 1 }, (_, i) => first + i)

  function emit(nextYear: number, nextMonth: number) {
    onChange(`${nextYear}-${String(nextMonth).padStart(2, "0")}`)
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={String(month)}
        onValueChange={(next) => emit(year, Number(next))}
      >
        <SelectTrigger
          className="min-w-0 flex-1 sm:w-40 sm:flex-none"
          aria-label={label === "Mes" ? "Mes" : `${label}: mes`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, index) => (
            <SelectItem key={name} value={String(index + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(year)}
        onValueChange={(next) => emit(Number(next), month)}
      >
        <SelectTrigger
          className="w-24 shrink-0"
          aria-label={label === "Mes" ? "Año" : `${label}: año`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((item) => (
            <SelectItem key={item} value={String(item)}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
