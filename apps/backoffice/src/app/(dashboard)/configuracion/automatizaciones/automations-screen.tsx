"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, Play } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  Job,
  JobExecution,
  JobExecutionStatus,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import { LoadMore } from "@/components/load-more"
import {
  EXECUTION_STATUS_META,
  formatDateTime,
  relativeTime,
  TRIGGER_LABELS,
} from "@/lib/automations"
import {
  useInfiniteExecutions,
  useJobs,
  useRunJob,
} from "@/lib/automations-api"
import { currentPeriod } from "@/lib/billing"

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/
/** Los jobs que aceptan un mes al correrlos a mano. */
const PERIOD_JOBS = new Set([
  "installments.generate",
  "settlements.statement-reminder",
])

type StatusFilter = JobExecutionStatus | "ALL"

/** Configuración → Automatizaciones (rediseño Fase 13, sección 6). Sólo admin. */
export function AutomationsScreen() {
  const { user } = useSession()
  const jobs = useJobs()
  const [running, setRunning] = React.useState<Job | null>(null)

  if (user && user.role !== "ADMIN") {
    return (
      <EmptyState
        title="Sólo para administradores"
        description="Las automatizaciones las configura y controla un administrador."
        action={
          <Button variant="outline" asChild>
            <Link href="/configuracion">Volver a configuración</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/configuracion"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Configuración
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Automatizaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Lo que el sistema hace solo: cuotas, aumentos, índices, avisos. Cada
            corrida queda registrada; si algo falla, se ve acá y en el inicio.
          </p>
        </div>
      </div>

      {jobs.isPending ? (
        <PageSkeleton cards={3} />
      ) : jobs.isError ? (
        <EmptyState
          title="No se pudieron cargar las automatizaciones"
          description={apiErrorMessage(
            jobs.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void jobs.refetch()}>Reintentar</Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {jobs.data.map((job) => (
            <li key={job.name}>
              <JobCard job={job} onRun={() => setRunning(job)} />
            </li>
          ))}
        </ul>
      )}

      <ExecutionHistory jobs={jobs.data ?? []} />

      {running && (
        <RunDialog
          key={running.name}
          job={running}
          open
          onOpenChange={(open) => !open && setRunning(null)}
        />
      )}
    </div>
  )
}

function JobCard({ job, onRun }: { job: Job; onRun: () => void }) {
  const last = job.lastExecution
  const meta = last ? EXECUTION_STATUS_META[last.status] : null
  return (
    <article className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">{job.title}</h2>
          <p className="text-sm text-muted-foreground">{job.description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRun}
          aria-label={`Ejecutar ${job.title} ahora`}
        >
          <Play aria-hidden />
          Ejecutar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {job.cronLabel}
        {job.scope === "GLOBAL" && " · global, para todas las inmobiliarias"}
        {job.nextRunAt && ` · próxima: ${formatDateTime(job.nextRunAt)}`}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 text-sm">
        {last && meta ? (
          <>
            <Badge variant={meta.badge}>{meta.label}</Badge>
            <span className="text-muted-foreground">
              {relativeTime(last.startedAt)}
              {last.summary && ` · ${last.summary}`}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Todavía no corrió.</span>
        )}
      </div>
      {last?.error && <p className="text-xs text-destructive">{last.error}</p>}
    </article>
  )
}

/** Correr un job a mano (spec 3.1 "ejecutable manual si el cron falló"). */
function RunDialog({
  job,
  open,
  onOpenChange,
}: {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const run = useRunJob()
  const [period, setPeriod] = React.useState(currentPeriod())
  const withPeriod = PERIOD_JOBS.has(job.name)

  async function confirm() {
    try {
      await run.mutateAsync({
        job: job.name,
        period: withPeriod ? period : undefined,
      })
      toast.success(
        `"${job.title}" encolada. El resultado aparece en el historial en unos segundos.`
      )
      onOpenChange(false)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo encolar la ejecución."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Ejecutar «{job.title}» ahora
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {job.description} Correrla dos veces no duplica nada.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {withPeriod && (
          <div className="px-4 sm:px-0">
            <label className="text-sm font-medium" htmlFor="run-period">
              Mes
            </label>
            <Input
              id="run-period"
              type="month"
              className="mt-1 w-44"
              value={period}
              onChange={(event) => {
                if (PERIOD.test(event.target.value))
                  setPeriod(event.target.value)
              }}
            />
          </div>
        )}
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={run.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={run.isPending}>
            Ejecutar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function ExecutionHistory({ jobs }: { jobs: Job[] }) {
  const [job, setJob] = React.useState("ALL")
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const query = useInfiniteExecutions({
    job: job === "ALL" ? undefined : job,
    status: status === "ALL" ? undefined : status,
  })
  const executions = query.data?.pages.flatMap((page) => page.data) ?? []
  const titles = new Map(jobs.map((j) => [j.name, j.title]))

  return (
    <section className="flex flex-col gap-3" aria-labelledby="executions-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="executions-title"
          className="font-display text-lg font-semibold"
        >
          Historial de ejecuciones
        </h2>
        <div className="flex flex-wrap gap-2">
          <Select value={job} onValueChange={setJob}>
            <SelectTrigger
              className="w-56"
              aria-label="Filtrar por automatización"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las automatizaciones</SelectItem>
              {jobs.map((j) => (
                <SelectItem key={j.name} value={j.name}>
                  {j.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="w-44" aria-label="Filtrar por resultado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los resultados</SelectItem>
              {(Object.keys(EXECUTION_STATUS_META) as JobExecutionStatus[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {EXECUTION_STATUS_META[key].label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      {query.isPending ? (
        <PageSkeleton cards={2} />
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(query.error, "No se pudo cargar el historial.")}
        </p>
      ) : executions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin ejecuciones todavía.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuándo</TableHead>
                <TableHead>Automatización</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Disparo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => (
                <ExecutionRow
                  key={execution.id}
                  execution={execution}
                  title={titles.get(execution.job) ?? execution.job}
                />
              ))}
            </TableBody>
          </Table>
          <LoadMore
            hasMore={query.hasNextPage}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </section>
  )
}

function ExecutionRow({
  execution,
  title,
}: {
  execution: JobExecution
  title: string
}) {
  const meta = EXECUTION_STATUS_META[execution.status]
  return (
    <TableRow>
      <TableCell className="tabular-nums">
        {formatDateTime(execution.startedAt)}
      </TableCell>
      <TableCell className="font-medium">
        {title}
        {execution.tenantId === null && (
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            · global
          </span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {execution.summary ??
          (execution.affected > 0 ? `${execution.affected} afectados` : "—")}
        {execution.error && (
          <p className="text-xs text-destructive">{execution.error}</p>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {TRIGGER_LABELS[execution.triggeredBy]}
        {execution.triggeredByUser &&
          ` · ${execution.triggeredByUser.fullName}`}
      </TableCell>
    </TableRow>
  )
}
