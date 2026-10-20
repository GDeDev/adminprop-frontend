"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  FileText,
  KeyRound,
  MessageCircle,
  Pencil,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type { RenterDetail } from "@adminprop/shared-types"
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
import { formatNationalId } from "@/lib/owners"
import { formatDate } from "@/lib/dates"
import { GUARANTEE_TYPE_LABELS, whatsappLink } from "@/lib/renters"
import {
  useDeleteRenter,
  useIssueRenterPortalCredentials,
  useRenter,
} from "@/lib/renters-api"

import { PaymentBadge } from "../renter-list"

/** Ficha de inquilino (spec Fase 8, 5.2). */
export function RenterDetailScreen({ id }: { id: string }) {
  const query = useRenter(id)

  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el inquilino"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/inquilinos">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  return <Detail renter={query.data} />
}

function Detail({ renter }: { renter: RenterDetail }) {
  const { user } = useSession()
  const whatsapp = whatsappLink(renter.phone)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/inquilinos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Inquilinos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {renter.fullName}
            </h1>
            <p className="text-sm text-muted-foreground tabular-nums">
              DNI/CUIT {formatNationalId(renter.nationalId)}
              {renter.moveInDate &&
                ` · Ingresó el ${formatDate(renter.moveInDate)}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <PaymentBadge renter={renter} />
              {renter.hasPortalAccess && (
                <Badge variant="outline" className="gap-1">
                  <KeyRound aria-hidden className="size-3" />
                  Con acceso al portal
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {whatsapp && (
              <Button variant="outline" asChild>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden />
                  WhatsApp
                </a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/inquilinos/${renter.id}/editar`}>
                <Pencil aria-hidden />
                Editar
              </Link>
            </Button>
            {user?.role === "ADMIN" && <DeleteButton renter={renter} />}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Datos">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd>{renter.phone ?? "—"}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all">{renter.email ?? "—"}</dd>
            <dt className="text-muted-foreground">Dirección</dt>
            <dd>{renter.address ?? "—"}</dd>
            <dt className="text-muted-foreground">Fecha de ingreso</dt>
            <dd>{formatDate(renter.moveInDate)}</dd>
          </dl>
          {renter.notes && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm whitespace-pre-line">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Observaciones internas
              </p>
              {renter.notes}
            </div>
          )}
        </Section>

        <Section
          title="Garante"
          action={
            renter.guarantor && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/garantes/${renter.guarantor.id}`}>Ver ficha</Link>
              </Button>
            )
          }
        >
          {renter.guarantor ? (
            <GuarantorSummaryCard guarantor={renter.guarantor} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin garante.{" "}
              <Link
                href={`/inquilinos/${renter.id}/editar`}
                className="underline"
              >
                Asignar
              </Link>
              .
            </p>
          )}
        </Section>

        <PortalAccessSection renter={renter} />

        <Section title="Contrato activo">
          {renter.activeContract ? (
            <Link
              href={`/contratos/${renter.activeContract.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            >
              <FileText aria-hidden className="size-4 text-muted-foreground" />
              Ver contrato
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin contrato activo.{" "}
              <Link href="/contratos/nuevo" className="underline">
                Nuevo contrato
              </Link>
              .
            </p>
          )}
        </Section>
        <Placeholder
          icon={Wallet}
          title="Historial de pagos"
          text="Aparece cuando existan contratos y cobros."
        />
      </div>
    </div>
  )
}

function GuarantorSummaryCard({
  guarantor,
}: {
  guarantor: NonNullable<RenterDetail["guarantor"]>
}) {
  const whatsapp = whatsappLink(guarantor.phone)
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden className="size-4 text-muted-foreground" />
        <Link
          href={`/garantes/${guarantor.id}`}
          className="font-medium hover:underline"
        >
          {guarantor.fullName}
        </Link>
        <span className="text-muted-foreground tabular-nums">
          {formatNationalId(guarantor.nationalId)}
        </span>
      </div>
      <p className="text-muted-foreground">
        {[guarantor.phone, guarantor.email].filter(Boolean).join(" · ") ||
          "Sin contacto"}
        {whatsapp && (
          <>
            {" · "}
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              WhatsApp
            </a>
          </>
        )}
      </p>
      <div>
        <Badge variant="outline">
          {GUARANTEE_TYPE_LABELS[guarantor.guaranteeType]}
        </Badge>
      </div>
      <p className="whitespace-pre-line">{guarantor.guaranteeDetail}</p>
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

function Placeholder({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FileText
  title: string
  text: string
}) {
  return (
    <section className="flex items-start gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        <h2 className="font-medium text-foreground">{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  )
}

function PortalAccessSection({ renter }: { renter: RenterDetail }) {
  const [open, setOpen] = React.useState(false)
  const [dialogKey, setDialogKey] = React.useState(0)
  const issue = useIssueRenterPortalCredentials()

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
          disabled={!renter.email}
        >
          <KeyRound aria-hidden />
          {renter.hasPortalAccess ? "Nueva contraseña" : "Generar acceso"}
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">
        {!renter.email
          ? "Cargale un email para poder darle acceso: es su usuario del portal."
          : renter.hasPortalAccess
            ? `Entra al portal con ${renter.email}. Si perdió la contraseña, generale una nueva: la anterior deja de servir.`
            : `Todavía no tiene acceso. Se le genera un usuario (${renter.email}) y una contraseña que se muestra una sola vez.`}
      </p>
      <PortalCredentialsDialog
        key={dialogKey}
        person={renter}
        portalName="inquilinos"
        issue={{
          mutateAsync: () => issue.mutateAsync(renter.id),
          isPending: issue.isPending,
        }}
        open={open}
        onOpenChange={setOpen}
      />
    </Section>
  )
}

function DeleteButton({ renter }: { renter: RenterDetail }) {
  const router = useRouter()
  const remove = useDeleteRenter()
  const [open, setOpen] = React.useState(false)

  async function confirm() {
    try {
      await remove.mutateAsync(renter.id)
      toast.success("Inquilino eliminado.")
      router.push("/inquilinos")
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
        aria-label="Eliminar inquilino"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              ¿Eliminar al inquilino?
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {renter.fullName} deja de aparecer en el sistema y pierde el
              acceso al portal. Con un contrato activo no se puede eliminar.
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
