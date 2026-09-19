import type { Role, User } from "@adminprop/shared-types"

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  EMPLOYEE: "Empleado",
  OWNER: "Propietario",
  RENTER: "Inquilino",
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role]
}

/** "Ana Gómez", o el email si no cargó nombre. */
export function displayName(
  user: Pick<User, "firstName" | "lastName" | "email">
): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  return name || user.email
}
