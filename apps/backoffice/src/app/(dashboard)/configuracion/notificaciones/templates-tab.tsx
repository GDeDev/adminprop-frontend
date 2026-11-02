"use client"

import * as React from "react"
import { Loader2, RotateCcw, Save, Send } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { NotificationTemplateDto } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
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
import { Textarea } from "@adminprop/ui/components/textarea"

import { insertVariable, unknownVariables } from "@/lib/notifications"
import {
  usePreviewTemplate,
  useNotificationTemplates,
  useRestoreNotificationTemplate,
  useSendTemplateTest,
  useUpdateNotificationTemplate,
} from "@/lib/notifications-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

import { VariableChips } from "./variable-chips"

/** Pestaña "Plantillas": editor de asunto y texto con vista previa en vivo. */
export function TemplatesTab() {
  const query = useNotificationTemplates()
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null)

  if (query.isPending) return <PageSkeleton />
  if (query.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          {apiErrorMessage(
            query.error,
            "No se pudieron cargar las plantillas."
          )}
        </AlertDescription>
      </Alert>
    )
  }
  const templates = query.data
  if (templates.length === 0) {
    return (
      <EmptyState
        title="Sin plantillas"
        description="Todavía no hay plantillas de email para editar."
      />
    )
  }
  const template =
    templates.find((candidate) => candidate.key === selectedKey) ??
    templates[0]!

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-w-md flex-col gap-1">
        <label htmlFor="template-select" className="text-sm font-medium">
          Plantilla
        </label>
        <Select value={template.key} onValueChange={setSelectedKey}>
          <SelectTrigger id="template-select" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((candidate) => (
              <SelectItem key={candidate.key} value={candidate.key}>
                {candidate.title}
                {candidate.isCustomized ? " (personalizada)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* `key`: al cambiar de plantilla o guardar, el editor arranca limpio. */}
      <TemplateEditor
        key={`${template.key}:${template.updatedAt ?? "default"}`}
        template={template}
      />
    </div>
  )
}

export function TemplateEditor({
  template,
}: {
  template: NotificationTemplateDto
}) {
  const [subject, setSubject] = React.useState(template.subject)
  const [bodyText, setBodyText] = React.useState(template.bodyText)
  const [restoreOpen, setRestoreOpen] = React.useState(false)
  const bodyRef = React.useRef<HTMLTextAreaElement>(null)
  const update = useUpdateNotificationTemplate()
  const restore = useRestoreNotificationTemplate()
  const sendTest = useSendTemplateTest()

  const dirty = subject !== template.subject || bodyText !== template.bodyText
  const unknown = unknownVariables(`${subject} ${bodyText}`, template.variables)
  const invalid = subject.trim() === "" || bodyText.trim() === ""

  function insert(name: string) {
    const area = bodyRef.current
    const start = area?.selectionStart ?? bodyText.length
    const end = area?.selectionEnd ?? bodyText.length
    const next = insertVariable(bodyText, name, start, end)
    setBodyText(next.text)
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(next.cursor, next.cursor)
    })
  }

  async function save() {
    try {
      await update.mutateAsync({ key: template.key, subject, bodyText })
      toast.success("Plantilla guardada.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo guardar la plantilla."))
    }
  }

  async function test() {
    try {
      const result = await sendTest.mutateAsync(template.key)
      toast.success(`Te enviamos una prueba a ${result.sentTo}.`)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo enviar la prueba."))
    }
  }

  async function restoreOriginal() {
    try {
      await restore.mutateAsync(template.key)
      toast.success("Se restauró el texto original.")
      setRestoreOpen(false)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo restaurar la plantilla."))
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        aria-label="Editor"
        className="flex flex-col gap-4 rounded-xl border bg-card p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold">
            {template.title}
          </h2>
          <Badge variant={template.isCustomized ? "alquilada" : "borrador"}>
            {template.isCustomized ? "Personalizada" : "Texto original"}
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="template-subject" className="text-sm font-medium">
            Asunto
          </label>
          <Input
            id="template-subject"
            value={subject}
            maxLength={200}
            onChange={(event) => setSubject(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="template-body" className="text-sm font-medium">
            Texto
          </label>
          <Textarea
            id="template-body"
            ref={bodyRef}
            rows={10}
            value={bodyText}
            onChange={(event) => setBodyText(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Insertar variable</p>
          <VariableChips variables={template.variables} onInsert={insert} />
          <p className="text-xs text-muted-foreground">
            Se insertan en el texto, donde está el cursor. Los datos faltantes
            salen vacíos; el mail se envía igual.
          </p>
        </div>

        {unknown.length > 0 && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              Variables que no existen en esta plantilla:{" "}
              {unknown.map((name) => `{{${name}}}`).join(", ")}.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void save()}
            disabled={
              !dirty || invalid || unknown.length > 0 || update.isPending
            }
          >
            {update.isPending ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Save aria-hidden />
            )}
            Guardar
          </Button>
          <Button
            variant="outline"
            onClick={() => void test()}
            disabled={dirty || sendTest.isPending}
            title={dirty ? "Guardá los cambios para probar" : undefined}
          >
            <Send aria-hidden />
            Enviarme una prueba
          </Button>
          {template.isCustomized && (
            <Button variant="ghost" onClick={() => setRestoreOpen(true)}>
              <RotateCcw aria-hidden />
              Restaurar original
            </Button>
          )}
        </div>
        {dirty && (
          <p className="text-xs text-muted-foreground">
            La prueba usa el texto guardado: guardá antes de enviarla.
          </p>
        )}
      </section>

      <Preview
        templateKey={template.key}
        subject={subject}
        bodyText={bodyText}
      />

      <ResponsiveDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              Restaurar el texto original
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Se pierde la versión personalizada de &ldquo;{template.title}
              &rdquo; y los próximos avisos salen con el texto original.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreOpen(false)}
              disabled={restore.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void restoreOriginal()}
              disabled={restore.isPending}
            >
              Restaurar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}

/** Vista previa en vivo contra `/preview`, con datos de ejemplo del tipo. */
function Preview({
  templateKey,
  subject,
  bodyText,
}: {
  templateKey: string
  subject: string
  bodyText: string
}) {
  const [view, setView] = React.useState<"mail" | "text">("mail")
  const debouncedSubject = useDebouncedValue(subject, 400)
  const debouncedBody = useDebouncedValue(bodyText, 400)
  const { mutate, data, isPending, isError, error } = usePreviewTemplate()

  React.useEffect(() => {
    if (debouncedSubject.trim() === "" || debouncedBody.trim() === "") return
    mutate({
      key: templateKey,
      subject: debouncedSubject,
      bodyText: debouncedBody,
    })
  }, [templateKey, debouncedSubject, debouncedBody, mutate])

  return (
    <section
      aria-label="Vista previa"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Vista previa</h2>
        <div role="group" aria-label="Formato" className="flex gap-1">
          <Button
            size="sm"
            variant={view === "mail" ? "secondary" : "ghost"}
            aria-pressed={view === "mail"}
            onClick={() => setView("mail")}
          >
            Mail
          </Button>
          <Button
            size="sm"
            variant={view === "text" ? "secondary" : "ghost"}
            aria-pressed={view === "text"}
            onClick={() => setView("text")}
          >
            Texto
          </Button>
        </div>
      </div>
      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {apiErrorMessage(error, "No se pudo armar la vista previa.")}
        </p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          {isPending ? "Armando la vista previa…" : "Sin vista previa todavía."}
        </p>
      ) : (
        <div className={isPending ? "opacity-60" : undefined}>
          <p className="text-sm">
            <span className="text-muted-foreground">Asunto: </span>
            <span className="font-medium">{data.subject}</span>
          </p>
          {view === "mail" ? (
            <iframe
              title="Vista previa del email"
              sandbox=""
              srcDoc={data.html}
              className="mt-2 h-96 w-full rounded-md border bg-white"
            />
          ) : (
            <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted/50 p-3 font-sans text-sm whitespace-pre-wrap">
              {data.text}
            </pre>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Con datos de ejemplo. No se envía nada.
          </p>
        </div>
      )}
    </section>
  )
}
