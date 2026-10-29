"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  ChevronLeft,
  KeyRound,
  Landmark,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type { OwnerDetail, OwnerFeeSettings } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

import { PortalCredentialsDialog } from "@/components/portal-credentials-dialog"
import { formatCbu, formatNationalId, portfolioLabel } from "@/lib/owners"
import {
  useDeleteOwner,
  useIssueOwnerPortalCredentials,
  useOwner,
} from "@/lib/owners-api"

import { StatusBadge } from "../../propiedades/property-list"
import { ReducedFeeBadge } from "../owner-list"
import { BankAccountDialog } from "./bank-account-dialog"
import {
  OwnerFeeAccountSection,
  OwnerSettlementsSection,
} from "./owner-settlements-section"

/** Ficha de propietario (spec Fase 7, 5.2). */
export function OwnerDetailScreen({ id }: { id: string }) {
  const query = useOwner(id)

  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el propietario"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/propietarios">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  return <Detail owner={query.data} />
}

function Detail({ owner }: { owner: OwnerDetail }) {
  const { user } = useSession()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/propietarios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Propietarios
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {owner.fullName}
            </h1>
            <p className="text-sm text-muted-foreground tabular-nums">
              DNI/CUIT {formatNationalId(owner.nationalId)} ·{" "}
              {portfolioLabel(owner)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ReducedFeeBadge owner={owner} />
              {owner.hasPortalAccess && (
                <Badge variant="outline" className="gap-1">
                  <KeyRound aria-hidden className="size-3" />
                  Con acceso al portal
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/propietarios/${owner.id}/editar`}>
                <Pencil aria-hidden />
                Editar
              </Link>
            </Button>
            {user?.role === "ADMIN" && <DeleteButton owner={owner} />}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Datos">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd>{owner.phone ?? "—"}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all">{owner.email ?? "—"}</dd>
            <dt className="text-muted-foreground">Dirección</dt>
            <dd>{owner.address ?? "—"}</dd>
          </dl>
          {owner.notes && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm whitespace-pre-line">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Observaciones internas
              </p>
              {owner.notes}
            </div>
          )}
        </Section>

        <BankAccountSection owner={owner} />

        <Section title="Propiedades">
          {owner.properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin propiedades a su nombre. Se asignan desde cada propiedad.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {owner.properties.map((property) => (
                <li key={property.id} className="flex items-center gap-3 py-2">
                  <Building2
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <Link
                    href={`/propiedades/${property.id}`}
                    className="min-w-0 flex-1 truncate font-medium hover:underline"
                  >
                    {property.address}
                  </Link>
                  <StatusBadge status={property.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <PortalAccessSection owner={owner} />

        <OwnerSettlementsSection owner={owner} />
        <OwnerFeeAccountSection
          owner={owner}
          feeSettings={
            (owner as OwnerDetail & { feeSettings?: OwnerFeeSettings })
              .feeSettings
          }
        />
      </div>
    </div>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** La cuenta se cambia con una acción propia (D-40). */
function BankAccountSection({ owner }: { owner: OwnerDetail }) {
  const [open, setOpen] = React.useState(false)
  const [dialogKey, setDialogKey] = React.useState(0)
  const account = owner.bankAccount
  const empty =
    !account.cbu && !account.alias && !account.bankName && !account.holder

  function openDialog() {
    setDialogKey((k) => k + 1)
    setOpen(true)
  }

  return (
    <Section
      title="Cuenta bancaria"
      action={
        <Button variant="outline" size="sm" onClick={openDialog}>
          <Landmark aria-hidden />
          {empty ? "Cargar" : "Cambiar"}
        </Button>
      }
    >
      {empty ? (
        <p className="text-sm text-muted-foreground">
          Sin cuenta cargada. Hace falta para liquidarle.
        </p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">CBU</dt>
          <dd className="tabular-nums">
            {account.cbu ? formatCbu(account.cbu) : "—"}
          </dd>
          <dt className="text-muted-foreground">Alias</dt>
          <dd>{account.alias ?? "—"}</dd>
          <dt className="text-muted-foreground">Banco</dt>
          <dd>{account.bankName ?? "—"}</dd>
          <dt className="text-muted-foreground">Titular</dt>
          <dd>{account.holder ?? "—"}</dd>
        </dl>
      )}
      <BankAccountDialog
        key={dialogKey}
        owner={owner}
        open={open}
        onOpenChange={setOpen}
      />
    </Section>
  )
}

function PortalAccessSection({ owner }: { owner: OwnerDetail }) {
  const [open, setOpen] = React.useState(false)
  const [dialogKey, setDialogKey] = React.useState(0)
  const issue = useIssueOwnerPortalCredentials()

  function openDialog() {
    setDialogKey((k) => k + 1)
    setOpen(true)
  }

  return (
    <Section
      title="Acceso al portal"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={openDialog}
          disabled={!owner.email}
        >
          <KeyRound aria-hidden />
          {owner.hasPortalAccess ? "Nueva contraseña" : "Generar acceso"}
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">
        {!owner.email
          ? "Cargale un email para poder darle acceso: es su usuario del portal."
          : owner.hasPortalAccess
            ? `Entra al portal con ${owner.email}. Si perdió la contraseña, generale una nueva: la anterior deja de servir.`
            : `Todavía no tiene acceso. Se le genera un usuario (${owner.email}) y una contraseña que se muestra una sola vez.`}
      </p>
      <PortalCredentialsDialog
        key={dialogKey}
        person={owner}
        portalName="propietarios"
        issue={{
          mutateAsync: () => issue.mutateAsync(owner.id),
          isPending: issue.isPending,
        }}
        open={open}
        onOpenChange={setOpen}
      />
    </Section>
  )
}

function DeleteButton({ owner }: { owner: OwnerDetail }) {
  const router = useRouter()
  const remove = useDeleteOwner()
  const [open, setOpen] = React.useState(false)

  async function confirm() {
    try {
      await remove.mutateAsync(owner.id)
      toast.success("Propietario eliminado.")
      router.push("/propietarios")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo eliminar."))
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Eliminar propietario"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              ¿Eliminar al propietario?
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {owner.fullName} deja de aparecer en el sistema y pierde el acceso
              al portal. Si tiene propiedades asignadas, no se puede eliminar:
              primero reasignalas.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirm()}
              disabled={remove.isPending}
            >
              Eliminar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  )
}
