"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, MessageCircle, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type { GuarantorDetail } from "@adminprop/shared-types"
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

import { formatNationalId } from "@/lib/owners"
import { GUARANTEE_TYPE_LABELS, whatsappLink } from "@/lib/renters"
import { useDeleteGuarantor, useGuarantor } from "@/lib/renters-api"

import { GuarantorFormDialog } from "../guarantor-form-dialog"

/** Ficha de garante: datos, garantía y a quiénes garantiza. */
export function GuarantorDetailScreen({ id }: { id: string }) {
  const query = useGuarantor(id)

  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el garante"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/garantes">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  return <Detail guarantor={query.data} />
}

function Detail({ guarantor }: { guarantor: GuarantorDetail }) {
  const { user } = useSession()
  const [editing, setEditing] = React.useState(false)
  const [editKey, setEditKey] = React.useState(0)
  const whatsapp = whatsappLink(guarantor.phone)

  function openEdit() {
    setEditKey((k) => k + 1)
    setEditing(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/garantes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Garantes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {guarantor.fullName}
            </h1>
            <p className="text-sm text-muted-foreground tabular-nums">
              DNI/CUIT {formatNationalId(guarantor.nationalId)}
            </p>
            <div className="mt-2">
              <Badge variant="outline">
                {GUARANTEE_TYPE_LABELS[guarantor.guaranteeType]}
              </Badge>
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
            <Button variant="outline" onClick={openEdit}>
              <Pencil aria-hidden />
              Editar
            </Button>
            {user?.role === "ADMIN" && <DeleteButton guarantor={guarantor} />}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Datos">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd>{guarantor.phone ?? "—"}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="break-all">{guarantor.email ?? "—"}</dd>
            <dt className="text-muted-foreground">Dirección</dt>
            <dd>{guarantor.address ?? "—"}</dd>
          </dl>
          {guarantor.notes && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm whitespace-pre-line">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Observaciones internas
              </p>
              {guarantor.notes}
            </div>
          )}
        </Section>

        <Section title="Garantía">
          <p className="mb-1 text-sm text-muted-foreground">
            {GUARANTEE_TYPE_LABELS[guarantor.guaranteeType]}
          </p>
          <p className="text-sm whitespace-pre-line">
            {guarantor.guaranteeDetail}
          </p>
        </Section>

        <Section title="Inquilinos que garantiza">
          {guarantor.renters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no está asignado a ningún inquilino.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {guarantor.renters.map((renter) => (
                <li key={renter.id} className="flex items-center gap-3 py-2">
                  <Users
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <Link
                    href={`/inquilinos/${renter.id}`}
                    className="font-medium hover:underline"
                  >
                    {renter.fullName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <GuarantorFormDialog
        key={editKey}
        open={editing}
        onOpenChange={setEditing}
        guarantor={guarantor}
      />
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function DeleteButton({ guarantor }: { guarantor: GuarantorDetail }) {
  const router = useRouter()
  const remove = useDeleteGuarantor()
  const [open, setOpen] = React.useState(false)

  async function confirm() {
    try {
      await remove.mutateAsync(guarantor.id)
      toast.success("Garante eliminado.")
      router.push("/garantes")
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
        aria-label="Eliminar garante"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden />
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>¿Eliminar al garante?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {guarantor.fullName} deja de aparecer en el sistema. Si algún
              inquilino lo tiene asignado, no se puede eliminar: primero cambiá
              el garante de ese inquilino.
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
