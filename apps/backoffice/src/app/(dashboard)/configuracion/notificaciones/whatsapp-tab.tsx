"use client"

import * as React from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { WhatsAppTemplateDto } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Textarea } from "@adminprop/ui/components/textarea"

import { insertVariable, unknownVariables } from "@/lib/notifications"
import {
  useUpdateWhatsAppTemplate,
  useWhatsAppTemplates,
} from "@/lib/notifications-api"

import { VariableChips } from "./variable-chips"

/** Pestaña "WhatsApp": textos que el personal manda a mano desde las fichas. */
export function WhatsAppTab() {
  const query = useWhatsAppTemplates()

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
  if (query.data.length === 0) {
    return (
      <EmptyState
        title="Sin plantillas de WhatsApp"
        description="Todavía no hay textos para editar."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Adminprop no envía WhatsApp solo: arma el link con este texto y el
        personal lo manda desde la ficha del inquilino o del cobro.
      </p>
      <ul className="grid gap-4 lg:grid-cols-2">
        {query.data.map((template) => (
          <li key={template.key}>
            <WhatsAppTemplateCard key={template.body} template={template} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WhatsAppTemplateCard({
  template,
}: {
  template: WhatsAppTemplateDto
}) {
  const [body, setBody] = React.useState(template.body)
  const areaRef = React.useRef<HTMLTextAreaElement>(null)
  const update = useUpdateWhatsAppTemplate()
  const dirty = body !== template.body
  const unknown = unknownVariables(body, template.variables)
  const fieldId = `whatsapp-${template.key}`

  function insert(name: string) {
    const area = areaRef.current
    const start = area?.selectionStart ?? body.length
    const end = area?.selectionEnd ?? body.length
    const next = insertVariable(body, name, start, end)
    setBody(next.text)
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(next.cursor, next.cursor)
    })
  }

  async function save() {
    try {
      await update.mutateAsync({ key: template.key, body })
      toast.success("Texto guardado.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo guardar el texto."))
    }
  }

  return (
    <section
      aria-label={template.title}
      className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold">{template.title}</h2>
        {template.isCustomized && (
          <Badge variant="alquilada">Personalizada</Badge>
        )}
      </div>
      <label htmlFor={fieldId} className="sr-only">
        Texto de {template.title}
      </label>
      <Textarea
        id={fieldId}
        ref={areaRef}
        rows={6}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <VariableChips variables={template.variables} onInsert={insert} />
      {unknown.length > 0 && (
        <p className="text-sm text-destructive" role="alert">
          Variables que no existen:{" "}
          {unknown.map((name) => `{{${name}}}`).join(", ")}.
        </p>
      )}
      <div>
        <Button
          onClick={() => void save()}
          disabled={
            !dirty ||
            body.trim() === "" ||
            unknown.length > 0 ||
            update.isPending
          }
        >
          {update.isPending ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <Save aria-hidden />
          )}
          Guardar
        </Button>
      </div>
    </section>
  )
}
