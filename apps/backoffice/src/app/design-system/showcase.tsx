"use client"

import * as React from "react"
import {
  Building2,
  FileText,
  Plus,
  Search,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@adminprop/ui/components/alert"
import { AiBadge, AiSparkle } from "@adminprop/ui/components/ai-badge"
import {
  AnimatedList,
  AnimatedListItem,
} from "@adminprop/ui/components/animated-list"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"
import { Checkbox } from "@adminprop/ui/components/checkbox"
import { CommandPalette } from "@adminprop/ui/components/command-palette"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { GradientSurface } from "@adminprop/ui/components/gradient-surface"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"
import { Progress } from "@adminprop/ui/components/progress"
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@adminprop/ui/components/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { Skeleton } from "@adminprop/ui/components/skeleton"
import { StatCard } from "@adminprop/ui/components/stat-card"
import { Switch } from "@adminprop/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@adminprop/ui/components/tabs"
import { ThemeToggle } from "@adminprop/ui/components/theme-toggle"
import { tenantThemeStyle } from "@adminprop/ui/lib/tenant-theme"

const COLOR_GROUPS: Array<{ title: string; tokens: string[] }> = [
  {
    title: "Superficies",
    tokens: [
      "background",
      "card",
      "popover",
      "surface-sunken",
      "muted",
      "border",
    ],
  },
  {
    title: "Marca (el tenant pisa primary)",
    tokens: [
      "primary",
      "primary-soft",
      "accent",
      "accent-soft",
      "secondary",
      "foreground",
    ],
  },
  {
    title: "Estados",
    tokens: [
      "success",
      "success-soft",
      "warning",
      "warning-soft",
      "info",
      "info-soft",
      "destructive",
      "destructive-soft",
    ],
  },
  { title: "IA", tokens: ["ai", "ai-soft", "ai-from", "ai-via", "ai-to"] },
  {
    title: "Chrome oscuro",
    tokens: [
      "sidebar",
      "sidebar-border",
      "sidebar-muted",
      "sidebar-foreground",
    ],
  },
]

const TYPE_SCALE = [
  {
    cls: "text-display-xl",
    name: "display-xl · 52",
    sample: "Alquilá con calma",
  },
  {
    cls: "text-display-lg",
    name: "display-lg · 40",
    sample: "Contratos al día",
  },
  { cls: "text-display-md", name: "display-md · 30", sample: "$ 1.250.000,00" },
  {
    cls: "text-title-lg",
    name: "title-lg · 24",
    sample: "Liquidación de junio",
  },
  {
    cls: "text-title-md",
    name: "title-md · 19",
    sample: "Departamento en Palermo",
  },
  {
    cls: "text-title-sm",
    name: "title-sm · 16",
    sample: "Datos del inquilino",
  },
  {
    cls: "text-body",
    name: "body · 15",
    sample: "El texto de todos los días se lee a 15 píxeles.",
  },
  { cls: "text-label", name: "label · 13", sample: "Etiqueta de campo" },
  {
    cls: "text-caption",
    name: "caption · 12",
    sample: "Actualizado hace 3 minutos",
  },
]

const ELEVATIONS = [
  { cls: "shadow-edge", name: "1 · edge", use: "Botones outline, alertas" },
  { cls: "shadow-raised", name: "2 · raised", use: "Cards, tablas" },
  { cls: "shadow-float", name: "3 · float", use: "Popovers, menús, toasts" },
  { cls: "shadow-overlay", name: "4 · overlay", use: "Diálogos, drawers" },
]

const RADII = [
  { cls: "rounded-sm", name: "sm · 6" },
  { cls: "rounded-md", name: "md · 10 (controles)" },
  { cls: "rounded-lg", name: "lg · 14" },
  { cls: "rounded-xl", name: "xl · 20 (superficies)" },
  { cls: "rounded-2xl", name: "2xl · 28" },
  { cls: "rounded-full", name: "full" },
]

// Colores de prueba para simular inmobiliarias. Son datos de la demo, no
// estilos: en producción el color sale de Tenant.primaryColor.
const SAMPLE_TENANTS = [
  { name: "Default", color: null },
  { name: "Verde", color: "#314c38" },
  { name: "Bordó", color: "#7a1f3d" },
  { name: "Amarillo", color: "#f5c542" },
]

type TenantStyle = React.CSSProperties | undefined

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-title-lg font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** Simula el tema por inmobiliaria pisando --primary en el <html>. */
function TenantThemeSimulator({
  onChange,
}: {
  onChange: (style: TenantStyle) => void
}) {
  const [active, setActive] = React.useState<string | null>(null)

  const apply = React.useCallback(
    (color: string | null) => {
      const root = document.documentElement
      root.style.removeProperty("--primary")
      root.style.removeProperty("--primary-foreground")
      const style = tenantThemeStyle(color)
      for (const [name, value] of Object.entries(
        (style ?? {}) as Record<string, string>
      )) {
        root.style.setProperty(name, value)
      }
      onChange(style)
      setActive(color)
    },
    [onChange]
  )

  React.useEffect(() => () => apply(null), [apply])

  return (
    <div className="flex flex-wrap gap-2">
      {SAMPLE_TENANTS.map((tenant) => (
        <Button
          key={tenant.name}
          variant={active === tenant.color ? "default" : "outline"}
          onClick={() => apply(tenant.color)}
        >
          {tenant.name}
        </Button>
      ))}
    </div>
  )
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 rounded-lg border shadow-edge"
        style={{ background: `var(--${token})` }}
      />
      <span className="text-caption text-muted-foreground">{token}</span>
    </div>
  )
}

/** Cada demo de movimiento se reinicia cambiando la key. */
function MotionDemo({
  name,
  detail,
  children,
}: {
  name: string
  detail: string
  children: (key: number) => React.ReactNode
}) {
  const [run, setRun] = React.useState(0)
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised">
      <div className="flex min-h-16 items-center justify-center">
        {children(run)}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-label font-medium">{name}</span>
          <span className="text-caption text-muted-foreground">{detail}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRun((n) => n + 1)}
        >
          Reproducir
        </Button>
      </div>
    </div>
  )
}

function Motion() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MotionDemo
        name="fade-up"
        detail="320 ms · ease-out · entrada de pantalla"
      >
        {(key) => (
          <div
            key={key}
            className="animate-fade-up rounded-lg bg-primary-soft px-4 py-2 text-primary"
          >
            Contenido
          </div>
        )}
      </MotionDemo>
      <MotionDemo name="scale-in" detail="200 ms · ease-out · popovers y menús">
        {(key) => (
          <div
            key={key}
            className="animate-scale-in rounded-lg bg-accent-soft px-4 py-2 text-foreground"
          >
            Menú
          </div>
        )}
      </MotionDemo>
      <MotionDemo name="stagger" detail="40 ms entre ítems · tope en 8">
        {(key) => (
          <ul key={key} className="flex w-full stagger flex-col gap-1.5">
            {["Uno", "Dos", "Tres"].map((n) => (
              <li key={n} className="rounded-md bg-muted px-3 py-1.5 text-sm">
                {n}
              </li>
            ))}
          </ul>
        )}
      </MotionDemo>
      <MotionDemo
        name="press + spring"
        detail="120 ms · escala 0,97 · switch con resorte"
      >
        {() => (
          <div className="flex items-center gap-4">
            <Button>Apretame</Button>
            <Switch aria-label="Demo de resorte" />
          </div>
        )}
      </MotionDemo>
      <MotionDemo name="shimmer" detail="1,6 s · solo transform">
        {() => <Skeleton className="h-10 w-full rounded-lg" />}
      </MotionDemo>
      <MotionDemo name="sparkle + glow" detail="2,4 s / 2,8 s · solo para IA">
        {() => (
          <div className="flex items-center gap-3">
            <AiSparkle animated className="size-6" />
            <span className="animate-glow-pulse rounded-full bg-ai-soft px-3 py-1 text-sm text-ai glow-ai">
              Sugerido
            </span>
          </div>
        )}
      </MotionDemo>
    </div>
  )
}

function ComponentsPanel({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Primario</Button>
        <Button variant="ai">
          <Sparkles /> Sugerir precio
        </Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Eliminar</Button>
        <Button variant="link">Link</Button>
        <Button size="icon" aria-label="Agregar">
          <Plus />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="disponible">Disponible</Badge>
        <Badge variant="alquilada">Alquilada</Badge>
        <Badge variant="mantenimiento">En mantenimiento</Badge>
        <Badge variant="mora">En mora</Badge>
        <Badge variant="borrador">Borrador</Badge>
        <AiBadge>Sugerido por IA</AiBadge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Cobrado del mes"
          value="$ 12.450.000,00"
          icon={Wallet}
          delta={{ label: "+4,2 %", trend: "up" }}
        />
        <StatCard
          label="En mora"
          value="7"
          icon={Users}
          delta={{ label: "+2", trend: "down" }}
        />
        <StatCard
          className="col-span-2 lg:col-span-1"
          label="Alquiler sugerido"
          value="$ 620.000,00"
          ai
          hint="Según 14 comparables"
        />
      </div>

      <GradientSurface variant="brand" className="flex flex-col gap-1">
        <p className="font-display text-title-lg font-semibold">
          Superficie de marca
        </p>
        <p className="text-sm opacity-90">
          Sale del primary de la inmobiliaria, con luz arriba.
        </p>
      </GradientSurface>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-address`}>Dirección</Label>
            <Input id={`${id}-address`} placeholder="Av. Siempre Viva 742" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-type`}>Tipo</Label>
            <Select>
              <SelectTrigger id={`${id}-type`} className="w-full">
                <SelectValue placeholder="Elegí un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">Casa</SelectItem>
                <SelectItem value="apartment">Departamento</SelectItem>
                <SelectItem value="store">Local</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id={`${id}-pets`} defaultChecked />
            <Label htmlFor={`${id}-pets`}>Acepta mascotas</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id={`${id}-published`} defaultChecked />
            <Label htmlFor={`${id}-published`}>Publicada</Label>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Ocupación del portfolio</Label>
            <Progress value={72} aria-label="Ocupación" />
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Junio 2026</TableCell>
              <TableCell>
                <Badge variant="disponible">Cobrado</Badge>
              </TableCell>
              <TableCell className="text-right font-display">
                $ 450.000,00
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Julio 2026</TableCell>
              <TableCell>
                <Badge variant="mora">Vencido</Badge>
              </TableCell>
              <TableCell className="text-right font-display">
                $ 472.500,00
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Contrato vigente</CardTitle>
              <CardDescription>Vence en 45 días</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="docs">
          <Alert>
            <FileText />
            <AlertTitle>Sin documentos</AlertTitle>
            <AlertDescription>
              Todavía no se subió el contrato firmado.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <EmptyState
        icon={Building2}
        title="Todavía no hay propiedades"
        description="Cargá la primera para empezar a administrarla."
        action={
          <Button>
            <Plus /> Nueva propiedad
          </Button>
        }
      />

      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      <AnimatedList className="grid gap-2">
        {["Alquiler cobrado", "Contrato por vencer", "Nueva consulta"].map(
          (text) => (
            <AnimatedListItem
              key={text}
              className="rounded-lg border bg-card px-4 py-3 text-sm shadow-edge"
            >
              {text}
            </AnimatedListItem>
          )
        )}
      </AnimatedList>
    </div>
  )
}

export function DesignSystemShowcase() {
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [tenantStyle, setTenantStyle] = React.useState<TenantStyle>(undefined)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 md:px-8 md:py-10">
      <GradientSurface variant="brand" className="flex flex-col gap-4 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-caption font-medium">
              <AiSparkle className="size-3.5" /> v2 · Cobre sobre tinta
            </span>
            <h1 className="text-display-md font-semibold md:text-display-xl">
              Sistema de diseño
            </h1>
            <p className="max-w-xl text-body opacity-90">
              Vitrina de desarrollo: tokens, tipografía, elevación, movimiento y
              componentes en claro y oscuro.
            </p>
          </div>
          <ThemeToggle className="border border-primary-foreground/30 hover:bg-primary-foreground/15" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setPaletteOpen(true)}
            className="gap-2"
          >
            <Search /> Paleta de comandos
          </Button>
          <Button
            variant="outline"
            className="bg-transparent text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            onClick={() => toast.success("Pago registrado")}
          >
            Mostrar toast
          </Button>
        </div>
      </GradientSurface>

      <Section
        title="Tema por inmobiliaria"
        hint={
          <>
            Pisa <code>--primary</code> en el <code>&lt;html&gt;</code>, como
            hará el server con el color del tenant. Botones, foco, glow,
            degradés y héroes siguen al color sin tocar ningún componente.
          </>
        }
      >
        <TenantThemeSimulator onChange={setTenantStyle} />
      </Section>

      <Section title="Colores" hint="OKLCH. Cada token cambia en oscuro.">
        <div className="flex flex-col gap-6">
          {COLOR_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <h3 className="text-title-sm font-medium">{group.title}</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {group.tokens.map((token) => (
                  <Swatch key={token} token={token} />
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <h3 className="text-title-sm font-medium">
              Degradés (derivados de los tokens)
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex h-20 items-end rounded-xl bg-primary-gradient p-3 text-caption text-primary-foreground shadow-primary-edge">
                primary-gradient
              </div>
              <div className="flex h-20 items-end rounded-xl bg-ai-gradient p-3 text-caption text-ai-foreground shadow-primary-edge">
                ai-gradient (solo decorativo)
              </div>
              <div className="flex h-20 items-end rounded-xl border bg-mesh p-3 text-caption text-muted-foreground">
                mesh
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Tipografía"
        hint="Bricolage Grotesque (títulos y cifras) + Geist (interfaz) + Geist Mono (datos)."
      >
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-raised">
          {TYPE_SCALE.map((row) => (
            <div
              key={row.name}
              className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0 md:flex-row md:items-baseline md:gap-6"
            >
              <span className="w-32 shrink-0 font-mono text-caption text-muted-foreground">
                {row.name}
              </span>
              <span
                className={`${row.cls} ${row.cls.includes("display") || row.cls.includes("title") ? "font-display font-semibold" : ""}`}
              >
                {row.sample}
              </span>
            </div>
          ))}
          <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
            <span className="w-32 shrink-0 font-mono text-caption text-muted-foreground">
              mono · num
            </span>
            <span className="font-mono text-sm">
              CBU 0170 0099 2000 0012 3456 78
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 rounded-xl border bg-card p-5 shadow-raised">
          <span className="text-caption text-muted-foreground">
            Montos: display, tabulares, a la derecha
          </span>
          <span className="font-display num text-display-md font-semibold">
            $ 1.250.000,00
          </span>
          <span className="font-display num text-display-md font-semibold">
            $ 8.888.111,00
          </span>
        </div>
      </Section>

      <Section title="Elevación y radios">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ELEVATIONS.map((level) => (
            <div
              key={level.cls}
              className={`${level.cls} flex h-28 flex-col justify-end rounded-xl border bg-card p-4`}
            >
              <span className="text-label font-medium">{level.name}</span>
              <span className="text-caption text-muted-foreground">
                {level.use}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div
              key={radius.cls}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`${radius.cls} size-16 border bg-primary-soft shadow-edge`}
              />
              <span className="text-caption text-muted-foreground">
                {radius.name}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Movimiento"
        hint="Se anima solo transform y opacity. Con prefers-reduced-motion todo queda quieto."
      >
        <Motion />
      </Section>

      <Section
        title="Componentes"
        hint="Mismo contenido a la izquierda con el tema activo y a la derecha siempre en oscuro. Los diálogos, menús y toasts se abren en el tema activo."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-background p-4 md:p-5">
            <p className="mb-4 text-label font-medium text-muted-foreground">
              Tema activo (usá el botón de arriba para alternar)
            </p>
            <ComponentsPanel id="light" />
          </div>
          <div
            className="dark rounded-2xl border bg-background p-4 text-foreground md:p-5"
            style={tenantStyle}
          >
            <p className="mb-4 text-label font-medium text-muted-foreground">
              Oscuro (forzado)
            </p>
            <ComponentsPanel id="dark" />
          </div>
        </div>
      </Section>

      <Section title="Mobile = Drawer, desktop = Dialog">
        <div className="flex flex-wrap gap-2">
          <ResponsiveDialog>
            <ResponsiveDialogTrigger asChild>
              <Button variant="outline">Abrir diálogo</Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle>Registrar pago</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  En mobile se abre desde abajo; desde md, centrado.
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <ResponsiveDialogFooter>
                <ResponsiveDialogClose asChild>
                  <Button variant="outline">Cerrar</Button>
                </ResponsiveDialogClose>
              </ResponsiveDialogFooter>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </Section>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={[
          {
            heading: "Ir a",
            items: [
              {
                id: "props",
                label: "Propiedades",
                icon: Building2,
                onSelect: () => toast("Propiedades"),
              },
              {
                id: "cobros",
                label: "Cobros",
                icon: Wallet,
                onSelect: () => toast("Cobros"),
              },
              {
                id: "contratos",
                label: "Contratos",
                icon: FileText,
                onSelect: () => toast("Contratos"),
              },
            ],
          },
          {
            heading: "Acciones",
            items: [
              {
                id: "new",
                label: "Nueva propiedad",
                icon: Plus,
                shortcut: "N",
                onSelect: () => toast("Nueva propiedad"),
              },
            ],
          },
        ]}
      />
    </div>
  )
}
