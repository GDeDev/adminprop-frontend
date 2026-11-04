"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { ANALYTICS_RANGES, rangeLabel } from "@/lib/crm-analytics"

/** Selector de los últimos 7, 30 o 90 días para las analíticas. */
export function AnalyticsRangeSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (days: number) => void
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger aria-label="Período" className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ANALYTICS_RANGES.map((days) => (
          <SelectItem key={days} value={String(days)}>
            {rangeLabel(days)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
