"use client"

import * as React from "react"
import { Building2, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@adminprop/ui/components/alert"
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
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"
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

const COLOR_TOKENS = [
  "background",
  "card",
  "primary",
  "primary-soft",
  "secondary",
  "muted",
  "accent",
  "accent-soft",
  "success",
  "success-soft",
  "warning",
  "warning-soft",
  "info",
  "info-soft",
  "destructive",
  "destructive-soft",
  "sidebar",
  "border",
]

// Colores de prueba para simular inmobiliarias. Son datos de la demo, no
// estilos: en producción el color sale de Tenant.primaryColor.
const SAMPLE_TENANTS = [
  { name: "Default", color: null },
  { name: "Verde", color: "#314c38" },
  { name: "Bordó", color: "#7a1f3d" },
  { name: "Amarillo", color: "#f5c542" },
]

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/** Simula el tema por inmobiliaria pisando --primary en el <html>. */
function TenantThemeSimulator() {
  const [active, setActive] = React.useState<string | null>(null)

  function apply(color: string | null) {
    const root = document.documentElement
    root.style.removeProperty("--primary")
    root.style.removeProperty("--primary-foreground")
    const style = tenantThemeStyle(color) as Record<string, string> | undefined
    for (const [name, value] of Object.entries(style ?? {})) {
      root.style.setProperty(name, value)
    }
    setActive(color)
  }

  React.useEffect(() => () => apply(null), [])

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

export function DesignSystemShowcase() {
  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Sistema de diseño
          </h1>
          <p className="text-muted-foreground">
            Vitrina de desarrollo: tokens, componentes y tema por inmobiliaria.
          </p>
        </div>
        <ThemeToggle className="border hover:bg-muted" />
      </header>

      <Section title="Tema por inmobiliaria">
        <p className="text-sm text-muted-foreground">
          Pisa <code>--primary</code> en el <code>&lt;html&gt;</code>, como hará
          el server con el color del tenant. Cambia toda la UI (botones, foco y
          badges por defecto) sin tocar ningún componente.
        </p>
        <TenantThemeSimulator />
      </Section>

      <Section title="Colores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {COLOR_TOKENS.map((token) => (
            <div key={token} className="flex flex-col gap-1">
              <div
                className="h-12 rounded-md border"
                style={{ background: `var(--${token})` }}
              />
              <span className="text-xs text-muted-foreground">{token}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografía">
        <p className="font-display text-3xl font-semibold">
          Outfit — títulos y montos
        </p>
        <p>Figtree — cuerpo e interfaz. El texto de todos los días.</p>
        <p className="text-right font-display text-2xl tabular-nums">
          $ 1.250.000,00
        </p>
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap gap-2">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Eliminar</Button>
          <Button variant="link">Link</Button>
          <Button size="icon" aria-label="Agregar">
            <Plus />
          </Button>
        </div>
      </Section>

      <Section title="Estados del dominio">
        <div className="flex flex-wrap gap-2">
          <Badge variant="disponible">Disponible</Badge>
          <Badge variant="alquilada">Alquilada</Badge>
          <Badge variant="mantenimiento">En mantenimiento</Badge>
          <Badge variant="mora">En mora</Badge>
          <Badge variant="borrador">Borrador</Badge>
        </div>
      </Section>

      <Section title="Formularios">
        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ds-address">Dirección</Label>
              <Input id="ds-address" placeholder="Av. Siempre Viva 742" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-type">Tipo</Label>
              <Select>
                <SelectTrigger id="ds-type" className="w-full">
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
              <Checkbox id="ds-pets" />
              <Label htmlFor="ds-pets">Acepta mascotas</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ds-published" />
              <Label htmlFor="ds-published">Publicada</Label>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Tabla con montos">
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
                <TableCell className="text-right font-display tabular-nums">
                  $ 450.000,00
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Julio 2026</TableCell>
                <TableCell>
                  <Badge variant="mora">Vencido</Badge>
                </TableCell>
                <TableCell className="text-right font-display tabular-nums">
                  $ 472.500,00
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </Section>

      <Section title="Tabs, alertas y cards">
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
              <AlertTitle>Sin documentos</AlertTitle>
              <AlertDescription>
                Todavía no se subió el contrato firmado.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
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
          <Button
            variant="outline"
            onClick={() => toast.success("Pago registrado")}
          >
            Mostrar toast
          </Button>
        </div>
      </Section>

      <Section title="Estado vacío">
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
      </Section>

      <Section title="Carga">
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </Section>
    </div>
  )
}
