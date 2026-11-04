"use client"

import * as React from "react"
import { Loader2, Mail, MessageCircle, Phone, Save, Send } from "lucide-react"
import { toast } from "sonner"

import type {
  InquiryCard,
  InquiryDetail,
  UpdateInquiryRequest,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
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
import { Skeleton } from "@adminprop/ui/components/skeleton"
import { Textarea } from "@adminprop/ui/components/textarea"

import { PropertySelect } from "@/components/property-select"
import {
  MAX_NOTE_LENGTH,
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
  activityText,
  crmApiError,
  stageMeta,
} from "@/lib/crm"
import {
  useAddNote,
  useAssignInquiry,
  useAssignees,
  useContactAttempt,
  useInquiry,
  useUpdateInquiry,
} from "@/lib/crm-api"
import { formatDate } from "@/lib/dates"
import { formatDateTime } from "@/lib/automations"
import { useWhatsAppTemplates } from "@/lib/notifications-api"

import type { RequestMove } from "./board"
import { useOpenWhatsApp } from "./inquiry-card"

const UNASSIGNED = "none"
const FIRST_CONTACT = "INQUIRY_FIRST_CONTACT"

/** Panel de detalle de una consulta (rediseño, sección 8). */
export function InquiryDrawer({
  id,
  onClose,
  onMove,
  stageCards,
}: {
  id: string | null
  onClose: () => void
  onMove: RequestMove
  /** Tarjetas de cada etapa, para calcular dónde cae al cambiarla desde acá. */
  stageCards: (stage: InquiryCard["stage"]) => InquiryCard[]
}) {
  const query = useInquiry(id)

  return (
    <ResponsiveDialog open={id !== null} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent className="max-h-[90dvh] overflow-y-auto md:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {query.data?.name ?? "Consulta"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {query.data
              ? `${SOURCE_LABELS[query.data.source]} · ${formatDateTime(query.data.createdAt)}`
              : "Cargando…"}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="flex flex-col gap-5 px-4 pb-4 md:px-0 md:pb-0">
          {query.isPending && id !== null && <Skeleton className="h-48" />}
          {query.isError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {crmApiError(query.error, "No se pudo cargar la consulta.")}
              </AlertDescription>
            </Alert>
          )}
          {query.data && (
            <Detail
              key={query.data.id}
              inquiry={query.data}
              onMove={onMove}
              stageCards={stageCards}
            />
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function Detail({
  inquiry,
  onMove,
  stageCards,
}: {
  inquiry: InquiryDetail
  onMove: RequestMove
  stageCards: (stage: InquiryCard["stage"]) => InquiryCard[]
}) {
  const meta = stageMeta(inquiry.stage)
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={meta.badge}>{meta.label}</Badge>
        {inquiry.lostReason && (
          <span className="text-sm text-muted-foreground">
            Motivo: {inquiry.lostReason}
          </span>
        )}
        {inquiry.closedAt && (
          <span className="text-sm text-muted-foreground">
            Cerrada el {formatDateTime(inquiry.closedAt)}
          </span>
        )}
      </div>
      {inquiry.message && (
        <p className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
          {inquiry.message}
        </p>
      )}
      <StageAssign inquiry={inquiry} onMove={onMove} stageCards={stageCards} />
      <EditForm inquiry={inquiry} />
      <WhatsAppSection inquiry={inquiry} />
      <ContactAttempts inquiry={inquiry} />
      <Timeline inquiry={inquiry} />
    </>
  )
}

function StageAssign({
  inquiry,
  onMove,
  stageCards,
}: {
  inquiry: InquiryDetail
  onMove: RequestMove
  stageCards: (stage: InquiryCard["stage"]) => InquiryCard[]
}) {
  const id = React.useId()
  const assignees = useAssignees()
  const assign = useAssignInquiry()

  async function changeAssignee(value: string) {
    try {
      await assign.mutateAsync({
        id: inquiry.id,
        userId: value === UNASSIGNED ? null : value,
      })
    } catch (error) {
      toast.error(crmApiError(error, "No se pudo asignar la consulta."))
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-stage`}>Etapa</Label>
        <Select
          value={inquiry.stage}
          onValueChange={(value) => {
            const stage = value as InquiryCard["stage"]
            const list = stageCards(stage)
            onMove(inquiry, stage, list, list.length)
          }}
        >
          <SelectTrigger id={`${id}-stage`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-assignee`}>Asignada a</Label>
        <Select
          value={inquiry.assignedTo?.id ?? UNASSIGNED}
          onValueChange={(value) => void changeAssignee(value)}
          disabled={assign.isPending}
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
    </div>
  )
}

function EditForm({ inquiry }: { inquiry: InquiryDetail }) {
  const id = React.useId()
  const update = useUpdateInquiry(inquiry.id)
  const [name, setName] = React.useState(inquiry.name)
  const [email, setEmail] = React.useState(inquiry.email ?? "")
  const [phone, setPhone] = React.useState(inquiry.phone ?? "")
  const [nextActionAt, setNextActionAt] = React.useState(
    inquiry.nextActionAt ?? ""
  )
  const [propertyId, setPropertyId] = React.useState(
    inquiry.property?.id ?? null
  )
  const noContact = email.trim() === "" && phone.trim() === ""
  const invalid = name.trim() === "" || noContact

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (invalid) return
    const body: UpdateInquiryRequest = {
      name: name.trim(),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(propertyId ? { propertyId } : {}),
      nextActionAt: nextActionAt || null,
    }
    try {
      await update.mutateAsync(body)
      toast.success("Consulta actualizada.")
    } catch (error) {
      toast.error(crmApiError(error, "No se pudo guardar la consulta."))
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="grid gap-3 sm:grid-cols-2"
      aria-label="Datos de la consulta"
    >
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-name`}>Nombre</Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={name.trim() === ""}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-property`}>Propiedad</Label>
        <PropertySelect
          id={`${id}-property`}
          value={propertyId}
          selectedLabel={inquiry.property?.address ?? null}
          onChange={(value) => setPropertyId(value)}
          placeholder="Consulta general"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={noContact}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-phone`}>Teléfono</Label>
        <Input
          id={`${id}-phone`}
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-invalid={noContact}
        />
      </div>
      {noContact && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          Cargá al menos un email o un teléfono.
        </p>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-follow`}>Próximo seguimiento</Label>
        <Input
          id={`${id}-follow`}
          type="date"
          value={nextActionAt}
          onChange={(event) => setNextActionAt(event.target.value)}
        />
        {inquiry.nextActionAt && (
          <p className="text-xs text-muted-foreground">
            Hoy figura el {formatDate(inquiry.nextActionAt)}.
          </p>
        )}
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={invalid || update.isPending}>
          {update.isPending ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <Save aria-hidden />
          )}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

function WhatsAppSection({ inquiry }: { inquiry: InquiryDetail }) {
  const id = React.useId()
  const templates = useWhatsAppTemplates()
  const openWhatsApp = useOpenWhatsApp()
  const [templateKey, setTemplateKey] = React.useState<string>(FIRST_CONTACT)

  if (!inquiry.hasWhatsApp) return null
  const options = templates.data ?? []

  return (
    <div className="flex flex-wrap items-end gap-2">
      {options.length > 0 && (
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-template`}>Plantilla de WhatsApp</Label>
          <Select value={templateKey} onValueChange={setTemplateKey}>
            <SelectTrigger id={`${id}-template`} className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((template) => (
                <SelectItem key={template.key} value={template.key}>
                  {template.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          void openWhatsApp(
            inquiry.id,
            options.some((item) => item.key === templateKey)
              ? templateKey
              : undefined
          )
        }
      >
        <MessageCircle aria-hidden />
        Enviar por WhatsApp
      </Button>
    </div>
  )
}

/** Registro manual de un llamado o un email (el de WhatsApp sale del botón). */
function ContactAttempts({ inquiry }: { inquiry: InquiryDetail }) {
  const attempt = useContactAttempt()

  async function register(channel: "PHONE" | "EMAIL") {
    try {
      await attempt.mutateAsync({ id: inquiry.id, channel })
      toast.success("Intento de contacto registrado.")
    } catch (error) {
      toast.error(crmApiError(error, "No se pudo registrar el contacto."))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">
        Registrar un intento de contacto:
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 md:min-h-8"
        disabled={attempt.isPending}
        onClick={() => void register("PHONE")}
      >
        <Phone aria-hidden />
        Llamado
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="min-h-11 md:min-h-8"
        disabled={attempt.isPending}
        onClick={() => void register("EMAIL")}
      >
        <Mail aria-hidden />
        Email
      </Button>
    </div>
  )
}

function Timeline({ inquiry }: { inquiry: InquiryDetail }) {
  const id = React.useId()
  const addNote = useAddNote(inquiry.id)
  const [body, setBody] = React.useState("")
  const trimmed = body.trim()

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!trimmed) return
    try {
      await addNote.mutateAsync({ body: trimmed })
      setBody("")
    } catch (error) {
      toast.error(crmApiError(error, "No se pudo guardar la nota."))
    }
  }

  const activities = [...inquiry.activities].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-3">
      <h3 id={`${id}-title`} className="font-display text-base font-semibold">
        Historial
      </h3>
      <form onSubmit={(event) => void submit(event)} className="grid gap-2">
        <Label htmlFor={`${id}-note`}>Agregar una nota</Label>
        <Textarea
          id={`${id}-note`}
          value={body}
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          onChange={(event) => setBody(event.target.value)}
          aria-describedby={`${id}-note-hint`}
        />
        <div className="flex items-center justify-between gap-2">
          <p id={`${id}-note-hint`} className="text-xs text-muted-foreground">
            Las notas no se pueden editar ni borrar. {body.length}/
            {MAX_NOTE_LENGTH}
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={!trimmed || addNote.isPending}
          >
            {addNote.isPending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Send aria-hidden />
            )}
            Agregar nota
          </Button>
        </div>
      </form>
      {activities.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no hay actividad registrada.
        </p>
      )}
      <ol className="flex flex-col gap-2 border-l pl-4">
        {activities.map((activity) => (
          <li key={activity.id} className="text-sm">
            <p
              className={activity.type === "NOTE" ? "whitespace-pre-wrap" : ""}
            >
              {activity.type === "NOTE" && (
                <span className="mr-1 font-medium">Nota:</span>
              )}
              {activityText(activity)}
            </p>
            <p className="text-xs text-muted-foreground">
              {activity.author?.fullName ?? "Sistema"} ·{" "}
              {formatDateTime(activity.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
