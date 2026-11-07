"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { CreateInquiryRequest } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"
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
import { Textarea } from "@adminprop/ui/components/textarea"

import { PropertySelect } from "@/components/property-select"
import { MANUAL_SOURCES, SOURCE_LABELS, crmApiError } from "@/lib/crm"
import { useAssignees, useCreateInquiry } from "@/lib/crm-api"

const UNASSIGNED = "none"

/** Estado del formulario → pedido, o `null` si falta algo obligatorio. */
export function buildCreateRequest(form: {
  name: string
  email: string
  phone: string
  message: string
  propertyId: string | null
  source: CreateInquiryRequest["source"]
  assignedToId: string
}): CreateInquiryRequest | null {
  const name = form.name.trim()
  const email = form.email.trim()
  const phone = form.phone.trim()
  if (!name || (!email && !phone)) return null
  return {
    name,
    source: form.source,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(form.message.trim() ? { message: form.message.trim() } : {}),
    ...(form.propertyId ? { propertyId: form.propertyId } : {}),
    ...(form.assignedToId !== UNASSIGNED
      ? { assignedToId: form.assignedToId }
      : {}),
  }
}

/** Carga manual de una consulta: llamado, WhatsApp o visita espontánea. */
export function NewInquiryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-h-[90dvh] overflow-y-auto">
        {open && <NewInquiryForm onDone={() => onOpenChange(false)} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function NewInquiryForm({ onDone }: { onDone: () => void }) {
  const id = React.useId()
  const create = useCreateInquiry()
  const assignees = useAssignees()
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    propertyId: null as string | null,
    source: "WHATSAPP" as CreateInquiryRequest["source"],
    assignedToId: UNASSIGNED,
  })
  const [touched, setTouched] = React.useState(false)
  const request = buildCreateRequest(form)
  const noContact = form.email.trim() === "" && form.phone.trim() === ""

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!request) return
    try {
      await create.mutateAsync(request)
      toast.success("Consulta cargada.")
      onDone()
    } catch (error) {
      toast.error(crmApiError(error, "No se pudo cargar la consulta."))
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>Nueva consulta</ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          Para las que llegan por teléfono, WhatsApp o en persona.
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>
      <div className="grid gap-3 px-4 py-2 sm:grid-cols-2 md:px-0">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor={`${id}-name`}>Nombre</Label>
          <Input
            id={`${id}-name`}
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            aria-invalid={touched && form.name.trim() === ""}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-phone`}>Teléfono</Label>
          <Input
            id={`${id}-phone`}
            type="tel"
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
            aria-invalid={touched && noContact}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-email`}>Email</Label>
          <Input
            id={`${id}-email`}
            type="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            aria-invalid={touched && noContact}
          />
        </div>
        {touched && noContact && (
          <p role="alert" className="text-sm text-destructive sm:col-span-2">
            Cargá al menos un teléfono o un email.
          </p>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-source`}>Cómo llegó</Label>
          <Select
            value={form.source}
            onValueChange={(value) =>
              set("source", value as CreateInquiryRequest["source"])
            }
          >
            <SelectTrigger id={`${id}-source`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MANUAL_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {SOURCE_LABELS[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-assignee`}>Asignar a</Label>
          <Select
            value={form.assignedToId}
            onValueChange={(value) => set("assignedToId", value)}
          >
            <SelectTrigger id={`${id}-assignee`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
              {assignees.data?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor={`${id}-property`}>Propiedad (opcional)</Label>
          <PropertySelect
            id={`${id}-property`}
            value={form.propertyId}
            onChange={(value) => set("propertyId", value)}
            placeholder="Consulta general"
          />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor={`${id}-message`}>Mensaje (opcional)</Label>
          <Textarea
            id={`${id}-message`}
            rows={3}
            value={form.message}
            onChange={(event) => set("message", event.target.value)}
          />
        </div>
      </div>
      <ResponsiveDialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending && <Loader2 aria-hidden className="animate-spin" />}
          Cargar consulta
        </Button>
      </ResponsiveDialogFooter>
    </form>
  )
}
