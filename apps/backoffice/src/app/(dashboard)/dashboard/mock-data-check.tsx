"use client"

import { useQuery } from "@tanstack/react-query"

import {
  contracts,
  owners,
  properties,
  renters,
  withLatency,
} from "@adminprop/mocks"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"
import { Skeleton } from "@adminprop/ui/components/skeleton"

/**
 * Verificación técnica del scaffold: TanStack Query + mocks + skeleton.
 * Descartable — se reemplaza por el dashboard real de la Fase 19.
 */
export function MockDataCheck() {
  const { data, isPending } = useQuery({
    queryKey: ["scaffold", "mock-counts"],
    queryFn: () =>
      withLatency([
        { label: "Propiedades", value: properties.length },
        { label: "Propietarios", value: owners.length },
        { label: "Inquilinos", value: renters.length },
        { label: "Contratos", value: contracts.length },
      ]),
  })

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Datos de ejemplo</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : data?.map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="font-display text-3xl text-accent">
                    {item.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  mock
                </CardContent>
              </Card>
            ))}
      </div>
    </section>
  )
}
