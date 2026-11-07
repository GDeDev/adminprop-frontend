import type { ImportBatchDetail } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"

import {
  ENTITY_LABELS,
  ENTITY_ORDER,
  mastersSummary,
  mastersTotal,
} from "@/lib/migration"

/** Contadores por entidad y avisos de hojas faltantes / maestros a crear. */
export function CountsSummary({
  batch,
  imported = false,
}: {
  batch: ImportBatchDetail
  /** Muestra además cuántas se importaron y habla de maestros "creados". */
  imported?: boolean
}) {
  const masters = imported ? batch.mastersCreated : batch.mastersToCreate
  const rows = ENTITY_ORDER.filter(
    (entity) => batch.counts.byEntity[entity]?.total > 0
  )

  return (
    <div className="flex flex-col gap-3">
      {batch.missingSheets.length > 0 && (
        <Alert>
          <AlertDescription>
            Al archivo le faltan estas hojas, así que no se procesaron:{" "}
            {batch.missingSheets.join(", ")}.
          </AlertDescription>
        </Alert>
      )}
      {mastersTotal(masters) > 0 && (
        <Alert>
          <AlertDescription>
            {imported ? "Se crearon" : "Al confirmar se van a crear"} estos
            datos maestros que no existían: {mastersSummary(masters)}.
          </AlertDescription>
        </Alert>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          El archivo no tiene filas para importar.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((entity) => {
            const c = batch.counts.byEntity[entity]
            return (
              <li
                key={entity}
                className="rounded-xl border bg-card p-3 shadow-raised"
              >
                <p className="font-medium">{ENTITY_LABELS[entity]}</p>
                <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-4 text-sm">
                  <dt className="text-muted-foreground">Total</dt>
                  <dd>{c.total}</dd>
                  <dt className="text-muted-foreground">Listas</dt>
                  <dd>{c.valid}</dd>
                  <dt className="text-muted-foreground">Con errores</dt>
                  <dd className={c.errors > 0 ? "text-destructive" : undefined}>
                    {c.errors}
                  </dd>
                  <dt className="text-muted-foreground">En conflicto</dt>
                  <dd>{c.conflicts}</dd>
                  {imported && (
                    <>
                      <dt className="text-muted-foreground">Importadas</dt>
                      <dd>{c.imported}</dd>
                    </>
                  )}
                </dl>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
