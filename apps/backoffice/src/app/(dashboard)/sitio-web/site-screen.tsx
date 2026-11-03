"use client"

import * as React from "react"
import { Check, CircleDot, Globe } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  SiteContent,
  SiteSettings,
  SiteSettingsDraft,
  SiteTemplateInfo,
  SiteTemplateKey,
  SiteTheme,
} from "@adminprop/shared-types"
import { useMediaQuery } from "@adminprop/ui/hooks/use-media-query"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@adminprop/ui/components/tabs"

import {
  usePublishSite,
  useResetSiteTemplate,
  useSiteSettings,
  useSiteTemplates,
  useUnpublishSite,
  useUpdateSiteSettings,
} from "@/lib/site-api"
import { useTenantSettings } from "@/lib/tenant-settings-api"
import {
  TEMPLATE_LABELS,
  blocksWithErrors,
  buildDraftPatch,
  isDraftDirty,
  mapFieldErrors,
  siteErrorList,
  type ContentBlock,
  type SiteFieldError,
} from "@/lib/site"

import { ContentTab } from "./content-tab"
import { DesignTab } from "./design-tab"
import { DomainTab } from "./domain-tab"
import { FieldErrorsProvider } from "./fields"
import { PreviewPanel } from "./preview-panel"
import { SectionsTab } from "./sections-tab"
import { StatusCard } from "./status-card"
import { TemplatePicker } from "./template-picker"
import { useUnsavedGuard } from "./use-unsaved-guard"

type TabKey = "diseno" | "contenido" | "secciones" | "dominio" | "vista"

/** Mi sitio web: editor del sitio de la inmobiliaria (spec 6.2). Solo administradores. */
export function SiteScreen() {
  const { user } = useSession()

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        icon={Globe}
        title="Sólo para administradores"
        description="El sitio web de la inmobiliaria lo gestiona un administrador."
      />
    )
  }
  return <SiteEditor />
}

function SiteEditor() {
  const settingsQuery = useSiteSettings()
  const templatesQuery = useSiteTemplates()

  if (settingsQuery.isPending || templatesQuery.isPending) {
    return <PageSkeleton cards={3} />
  }
  if (settingsQuery.isError || templatesQuery.isError) {
    const error = settingsQuery.error ?? templatesQuery.error
    return (
      <EmptyState
        icon={Globe}
        title="No se pudo cargar tu sitio web"
        description={apiErrorMessage(error, "Probá de nuevo en un rato.")}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void settingsQuery.refetch()
              void templatesQuery.refetch()
            }}
          >
            Reintentar
          </Button>
        }
      />
    )
  }

  return (
    <Editor settings={settingsQuery.data} templates={templatesQuery.data} />
  )
}

function Editor({
  settings,
  templates,
}: {
  settings: SiteSettings
  templates: SiteTemplateInfo[]
}) {
  const tenant = useTenantSettings()
  const wide = useMediaQuery("(min-width: 96rem)")

  const update = useUpdateSiteSettings()
  const reset = useResetSiteTemplate()
  const publish = usePublishSite()
  const unpublish = useUnpublishSite()
  const busy =
    update.isPending ||
    reset.isPending ||
    publish.isPending ||
    unpublish.isPending

  // Copia local del borrador: `null` mientras no se editó nada.
  const [local, setLocal] = React.useState<SiteSettingsDraft | null>(null)
  const draft = local ?? settings.draft
  const dirty = local !== null && isDraftDirty(settings.draft, local)
  const template = templates.find((t) => t.key === draft.template)

  const [tab, setTab] = React.useState<TabKey>("diseno")
  const activeTab: TabKey = wide && tab === "vista" ? "diseno" : tab
  const [openBlocks, setOpenBlocks] = React.useState<string[]>(["brand"])
  const [previewVersion, setPreviewVersion] = React.useState(0)

  // Errores 422 por campo y los que no se pueden ubicar.
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [unmapped, setUnmapped] = React.useState<SiteFieldError[]>([])
  const clearErrors = React.useCallback((prefix: string) => {
    setErrors((prev) => {
      const keys = Object.keys(prev).filter((k) => k.startsWith(prefix))
      if (keys.length === 0) return prev
      const next = { ...prev }
      for (const key of keys) delete next[key]
      return next
    })
  }, [])
  const errorsValue = React.useMemo(
    () => ({ errors, clear: clearErrors }),
    [errors, clearErrors]
  )
  const errorCount = Object.keys(errors).length + unmapped.length
  const errorBlocks: ContentBlock[] = React.useMemo(
    () => blocksWithErrors(errors),
    [errors]
  )

  const guard = useUnsavedGuard(dirty)

  const [confirmPublish, setConfirmPublish] = React.useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = React.useState(false)
  const [publishProblems, setPublishProblems] = React.useState<
    SiteFieldError[] | null
  >(null)
  const [pendingTemplate, setPendingTemplate] =
    React.useState<SiteTemplateKey | null>(null)

  /* -------------------------- edición local -------------------------- */

  function edit(change: (current: SiteSettingsDraft) => SiteSettingsDraft) {
    setLocal((prev) => change(prev ?? settings.draft))
  }

  function editTheme(patch: Partial<SiteTheme>) {
    edit((d) => ({ ...d, theme: { ...d.theme, ...patch } }))
  }

  function editContent<K extends keyof SiteContent>(
    block: K,
    value: SiteContent[K]
  ) {
    edit((d) => ({ ...d, content: { ...d.content, [block]: value } }))
  }

  /* ----------------------------- errores ----------------------------- */

  /** Muestra los errores por campo de un 422; devuelve la lista (vacía si no era de campos). */
  function showFieldErrors(cause: unknown): SiteFieldError[] {
    const list = siteErrorList(cause)
    if (list.length === 0) return list
    const mapped = mapFieldErrors(list)
    setErrors(mapped.byPath)
    setUnmapped(mapped.unmapped)
    const blocks = blocksWithErrors(mapped.byPath)
    const contentBlocks = blocks.filter((b) => b !== "sections")
    if (contentBlocks.length > 0) {
      setOpenBlocks((prev) => [...new Set([...prev, ...contentBlocks])])
      setTab("contenido")
    } else if (blocks.includes("sections")) {
      setTab("secciones")
    } else if (Object.keys(mapped.byPath).some((p) => p.startsWith("theme"))) {
      setTab("diseno")
    }
    return list
  }

  function resetErrors() {
    setErrors({})
    setUnmapped([])
  }

  /* ----------------------------- acciones ---------------------------- */

  /** Guarda lo que cambió. `true` si no había nada o se guardó. */
  async function save(): Promise<boolean> {
    const patch = local ? buildDraftPatch(settings.draft, local) : null
    if (!patch) return true
    try {
      await update.mutateAsync(patch)
      setLocal(null)
      resetErrors()
      setPreviewVersion((v) => v + 1)
      toast.success("Borrador guardado.")
      return true
    } catch (cause) {
      if (showFieldErrors(cause).length > 0) {
        toast.error("Revisá los campos marcados: no se pudo guardar.")
      } else {
        toast.error(apiErrorMessage(cause, "No se pudo guardar el borrador."))
      }
      return false
    }
  }

  async function confirmAndPublish() {
    setPublishProblems(null)
    if (dirty && !(await save())) {
      setConfirmPublish(false)
      return
    }
    try {
      await publish.mutateAsync()
      resetErrors()
      setConfirmPublish(false)
      toast.success("Listo, tu sitio está publicado.")
    } catch (cause) {
      const list = showFieldErrors(cause)
      setPublishProblems(
        list.length > 0
          ? list
          : [
              {
                field: "",
                message: apiErrorMessage(
                  cause,
                  "No se pudo publicar el sitio."
                ),
              },
            ]
      )
    }
  }

  async function confirmAndUnpublish() {
    try {
      await unpublish.mutateAsync()
      toast.success("Despublicamos el sitio. Tu configuración sigue guardada.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo despublicar el sitio."))
    } finally {
      setConfirmUnpublish(false)
    }
  }

  /** Cambia de template (PUT) y, si se pide, restaura el tema por defecto (POST). */
  async function applyTemplate(restoreTheme: boolean) {
    const key = pendingTemplate
    if (!key) return
    const next: SiteSettingsDraft = { ...draft, template: key }
    const patch = buildDraftPatch(settings.draft, next)
    try {
      if (patch) await update.mutateAsync(patch)
      if (restoreTheme) await reset.mutateAsync({ keepContent: true })
      setLocal(null)
      resetErrors()
      setPreviewVersion((v) => v + 1)
      toast.success(
        restoreTheme
          ? "Cambiamos el template y restauramos su tema."
          : "Cambiamos el template. Tu tema quedó como estaba."
      )
    } catch (cause) {
      if (showFieldErrors(cause).length > 0) {
        toast.error(
          "Revisá los campos marcados: no se pudo cambiar el template."
        )
      } else {
        toast.error(apiErrorMessage(cause, "No se pudo cambiar el template."))
      }
    } finally {
      setPendingTemplate(null)
    }
  }

  const slug = tenant.data?.slug
  const previewPanel = <PreviewPanel slug={slug} version={previewVersion} />

  return (
    <FieldErrorsProvider value={errorsValue}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Mi sitio web
          </h1>
          <p className="text-sm text-muted-foreground">
            Armá el sitio de tu inmobiliaria: elegí un diseño, completá los
            textos y publicalo.
          </p>
        </div>

        <StatusCard
          settings={settings}
          onChooseSubdomain={() => setTab("dominio")}
        />

        <TemplatePicker
          templates={templates}
          value={draft.template}
          disabled={busy}
          onSelect={setPendingTemplate}
        />

        <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center justify-between gap-2 border-y bg-background/95 px-4 py-2 backdrop-blur md:top-0 md:-mx-8 md:px-8">
          <p role="status" className="flex items-center gap-1.5 text-sm">
            {dirty ? (
              <>
                <CircleDot aria-hidden className="size-4 text-warning" />
                Tenés cambios sin guardar
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Check aria-hidden className="size-4" />
                Borrador guardado
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {settings.enabled && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => setConfirmUnpublish(true)}
              >
                Despublicar
              </Button>
            )}
            <Button
              type="button"
              disabled={!dirty || busy}
              onClick={() => void save()}
            >
              {update.isPending && !publish.isPending
                ? "Guardando…"
                : "Guardar borrador"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setPublishProblems(null)
                setConfirmPublish(true)
              }}
            >
              Publicar
            </Button>
          </div>
        </div>

        {errorCount > 0 && (
          <Alert variant="destructive" role="alert">
            <AlertDescription className="flex flex-col gap-1">
              <span className="font-medium">
                {errorCount === 1
                  ? "Hay 1 cosa para corregir."
                  : `Hay ${errorCount} cosas para corregir.`}{" "}
                Las vas a ver marcadas en cada campo.
              </span>
              {unmapped.length > 0 && (
                <ul className="ml-4 list-disc">
                  {unmapped.map((error, index) => (
                    <li key={`${error.field}-${index}`}>{error.message}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div
          className={
            wide ? "grid grid-cols-[minmax(0,1fr)_32rem] items-start gap-6" : ""
          }
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setTab(value as TabKey)}
            className="min-w-0 gap-4"
          >
            <TabsList
              className="w-full justify-start overflow-x-auto group-data-[orientation=horizontal]/tabs:h-auto"
              aria-label="Secciones del editor"
            >
              {(
                [
                  ["diseno", "Diseño"],
                  ["contenido", "Contenido"],
                  ["secciones", "Secciones"],
                  ["dominio", "Dominio"],
                  ...(wide ? [] : [["vista", "Vista previa"]]),
                ] as [TabKey, string][]
              ).map(([key, label]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="h-11 flex-none px-4 md:h-9"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="diseno">
              <DesignTab
                theme={draft.theme}
                template={template}
                onChange={editTheme}
              />
            </TabsContent>
            <TabsContent value="contenido">
              <ContentTab
                content={draft.content}
                onChange={editContent}
                open={openBlocks}
                onOpenChange={setOpenBlocks}
                blocksWithErrors={errorBlocks}
              />
            </TabsContent>
            <TabsContent value="secciones">
              <SectionsTab
                sections={draft.content.sections}
                supported={template?.supportedSections}
                onChange={(sections) => editContent("sections", sections)}
              />
            </TabsContent>
            <TabsContent value="dominio">
              <DomainTab settings={settings} />
            </TabsContent>
            {!wide && <TabsContent value="vista">{previewPanel}</TabsContent>}
          </Tabs>
          {wide && <div className="sticky top-20">{previewPanel}</div>}
        </div>
      </div>

      {/* Cambiar de template */}
      <ResponsiveDialog
        open={pendingTemplate !== null}
        onOpenChange={(open) => !open && !busy && setPendingTemplate(null)}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              ¿Pasar al template{" "}
              {pendingTemplate ? TEMPLATE_LABELS[pendingTemplate] : ""}?
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Tus textos e imágenes se conservan. ¿Querés también restaurar los
              colores, la tipografía y las esquinas que trae este template?
              {dirty &&
                " Los cambios que tenías sin guardar se guardan con el cambio."}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setPendingTemplate(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void applyTemplate(false)}
            >
              Conservar mi tema
            </Button>
            <Button disabled={busy} onClick={() => void applyTemplate(true)}>
              Restaurar el tema del template
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Publicar */}
      <ResponsiveDialog
        open={confirmPublish}
        onOpenChange={(open) => !open && !busy && setConfirmPublish(false)}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {publishProblems ? "No pudimos publicar" : "¿Publicar el sitio?"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {publishProblems
                ? "Corregí esto y volvé a probar:"
                : `Lo que hay en el borrador pasa a verse en ${settings.publicUrl ?? "tu dirección pública"}.${dirty ? " Tenés cambios sin guardar: los guardamos antes de publicar." : ""}`}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          {publishProblems && (
            <ul className="ml-5 flex max-h-60 list-disc flex-col gap-1 overflow-y-auto text-sm">
              {publishProblems.map((problem, index) => (
                <li key={`${problem.field}-${index}`}>{problem.message}</li>
              ))}
            </ul>
          )}
          <ResponsiveDialogFooter>
            {publishProblems ? (
              <Button onClick={() => setConfirmPublish(false)}>
                Entendido
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirmPublish(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => void confirmAndPublish()}
                >
                  {busy ? "Publicando…" : "Publicar"}
                </Button>
              </>
            )}
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Despublicar */}
      <ResponsiveDialog
        open={confirmUnpublish}
        onOpenChange={(open) => !open && !busy && setConfirmUnpublish(false)}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              ¿Despublicar el sitio?
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              El público deja de verlo y la dirección muestra un error. No
              perdés nada: el contenido y la configuración se conservan y lo
              podés volver a publicar cuando quieras.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmUnpublish(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmAndUnpublish()}
            >
              Despublicar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Salir con cambios sin guardar */}
      <ResponsiveDialog
        open={guard.pendingHref !== null}
        onOpenChange={(open) => !open && guard.stay()}
      >
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>¿Salir sin guardar?</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Tenés cambios en el borrador que todavía no guardaste. Si salís,
              se pierden.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={guard.stay}>
              Seguir editando
            </Button>
            <Button variant="destructive" onClick={guard.leave}>
              Salir sin guardar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </FieldErrorsProvider>
  )
}
