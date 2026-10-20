"use client"

import * as React from "react"
import Link from "next/link"
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type { InternalRole, User } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adminprop/ui/components/dropdown-menu"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import { displayName, roleLabel } from "@/lib/users"
import { useSetUserActive, useUsers, type UserFilters } from "@/lib/users-api"

import { ResetPasswordDialog } from "./reset-password-dialog"
import { UserFormDialog } from "./user-form-dialog"

type RoleFilter = InternalRole | "ALL"
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE"

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
})

/** Gestión de usuarios internos (spec Fase 4, 3.6). Sólo admins. */
export function UsersScreen() {
  const { user: me } = useSession()

  if (me?.role !== "ADMIN") {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Sólo para administradores"
        description="Pedile a un administrador de la inmobiliaria que gestione los usuarios."
        action={
          <Button variant="outline" asChild>
            <Link href="/configuracion">Volver</Link>
          </Button>
        }
      />
    )
  }

  return <UsersManager meId={me.id} />
}

function UsersManager({ meId }: { meId: string }) {
  const [role, setRole] = React.useState<RoleFilter>("ALL")
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const [page, setPage] = React.useState(1)
  const [editing, setEditing] = React.useState<User | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  // Cambia en cada apertura: el diálogo se monta de nuevo y arranca limpio.
  const [formKey, setFormKey] = React.useState(0)
  const [resetting, setResetting] = React.useState<User | null>(null)

  const filters: UserFilters = {
    page,
    role: role === "ALL" ? undefined : role,
    isActive: status === "ALL" ? undefined : status === "ACTIVE",
  }
  const users = useUsers(filters)
  const setActive = useSetUserActive()

  function openCreate() {
    setEditing(null)
    setFormKey((k) => k + 1)
    setFormOpen(true)
  }

  function openEdit(user: User) {
    setEditing(user)
    setFormKey((k) => k + 1)
    setFormOpen(true)
  }

  async function toggleActive(user: User) {
    try {
      await setActive.mutateAsync({ id: user.id, active: !user.isActive })
      toast.success(
        user.isActive
          ? `${displayName(user)} quedó desactivado. Se cerraron sus sesiones.`
          : `${displayName(user)} volvió a estar activo.`
      )
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo cambiar el estado."))
    }
  }

  const actions = {
    meId,
    onEdit: openEdit,
    onReset: setResetting,
    onToggleActive: toggleActive,
  }
  const pagination = users.data?.pagination

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Administradores y empleados de la inmobiliaria.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Nuevo usuario
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value as RoleFilter)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filtrar por rol">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los roles</SelectItem>
            <SelectItem value="ADMIN">Administradores</SelectItem>
            <SelectItem value="EMPLOYEE">Empleados</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="INACTIVE">Desactivados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {users.isPending ? (
        <PageSkeleton cards={2} />
      ) : users.isError ? (
        <EmptyState
          title="No se pudieron cargar los usuarios"
          description={apiErrorMessage(
            users.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void users.refetch()}>Reintentar</Button>
          }
        />
      ) : users.data.data.length === 0 ? (
        <EmptyState
          title="No hay usuarios con esos filtros"
          description="Probá con otros filtros o creá un usuario nuevo."
        />
      ) : (
        <>
          {/* Mobile: tarjetas. Desktop: tabla. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {users.data.data.map((user) => (
              <li key={user.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{displayName(user)}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{roleLabel(user.role)}</Badge>
                      <StatusBadge active={user.isActive} />
                    </div>
                  </div>
                  <UserActions user={user} {...actions} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último ingreso</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {displayName(user)}
                      {user.id === meId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (vos)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{roleLabel(user.role)}</TableCell>
                    <TableCell>
                      <StatusBadge active={user.isActive} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt
                        ? dateFormat.format(new Date(user.lastLoginAt))
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                      <UserActions user={user} {...actions} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <nav
              aria-label="Paginación"
              className="flex items-center justify-between gap-3 text-sm"
            >
              <Button
                variant="outline"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}

      <UserFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        isSelf={editing?.id === meId}
      />
      <ResetPasswordDialog
        key={resetting?.id ?? "closed"}
        user={resetting}
        onOpenChange={(open) => !open && setResetting(null)}
      />
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline">Activo</Badge>
  ) : (
    <Badge variant="borrador">Desactivado</Badge>
  )
}

/**
 * Sobre uno mismo no se ofrece desactivar ni resetear (la API tampoco lo
 * deja): para la propia contraseña está "Cambiar contraseña".
 */
function UserActions({
  user,
  meId,
  onEdit,
  onReset,
  onToggleActive,
}: {
  user: User
  meId: string
  onEdit: (user: User) => void
  onReset: (user: User) => void
  onToggleActive: (user: User) => void
}) {
  const isSelf = user.id === meId

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Acciones para ${displayName(user)}`}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(user)}>
          <Pencil aria-hidden />
          Editar
        </DropdownMenuItem>
        {!isSelf && (
          <>
            <DropdownMenuItem onSelect={() => onReset(user)}>
              <KeyRound aria-hidden />
              Resetear contraseña
            </DropdownMenuItem>
            <DropdownMenuItem
              variant={user.isActive ? "destructive" : "default"}
              onSelect={() => onToggleActive(user)}
            >
              {user.isActive ? (
                <UserX aria-hidden />
              ) : (
                <UserCheck aria-hidden />
              )}
              {user.isActive ? "Desactivar" : "Reactivar"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
