"use client"

import * as React from "react"

import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@adminprop/ui/components/responsive-dialog"

/** Reglas de la API: mínimo 10 caracteres, con minúscula, mayúscula y número. */
export function passwordRuleError(password: string): string | null {
  if (password.length < 10) return "Tiene que tener al menos 10 caracteres."
  if (!/[a-z]/.test(password)) return "Tiene que incluir una minúscula."
  if (!/[A-Z]/.test(password)) return "Tiene que incluir una mayúscula."
  if (!/\d/.test(password)) return "Tiene que incluir un número."
  return null
}

export interface SecurityPanelProps {
  /**
   * Cambia la contraseña. Devuelve el mensaje de error a mostrar, o `null` si
   * salió bien (en ese caso la API cerró todas las sesiones y quien llama
   * tiene que llevar al login).
   */
  onChangePassword: (values: {
    currentPassword: string
    newPassword: string
  }) => Promise<string | null>
  /** Cierra la sesión en todos los dispositivos. Mismo contrato de retorno. */
  onLogoutAll: () => Promise<string | null>
  className?: string
}

/**
 * Sección "Seguridad" de la cuenta: cambiar la propia contraseña y cerrar
 * todas las sesiones. No sabe nada de la API: la app le pasa las acciones.
 */
export function SecurityPanel({
  onChangePassword,
  onLogoutAll,
  className,
}: SecurityPanelProps) {
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const currentError =
    touched && !current ? "Ingresá tu contraseña actual." : null
  const nextError = touched ? passwordRuleError(next) : null
  const confirmError =
    touched && !nextError && confirm !== next
      ? "Las contraseñas no coinciden."
      : null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setTouched(true)
    setError(null)
    if (!current || passwordRuleError(next) || confirm !== next) return
    setPending(true)
    const message = await onChangePassword({
      currentPassword: current,
      newPassword: next,
    })
    if (message) {
      setError(message)
      setPending(false)
    }
    // Sin error: la sesión se cerró y la app redirige al login.
  }

  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const [logoutError, setLogoutError] = React.useState<string | null>(null)
  const [logoutPending, setLogoutPending] = React.useState(false)

  async function logoutAll() {
    setLogoutPending(true)
    setLogoutError(null)
    const message = await onLogoutAll()
    if (message) {
      setLogoutError(message)
      setLogoutPending(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>
              Al cambiarla se cierran todas tus sesiones, incluida esta. Vas a
              tener que volver a ingresar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} noValidate>
              <FieldGroup>
                {error && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Field data-invalid={!!currentError}>
                  <FieldLabel htmlFor="security-current">
                    Contraseña actual
                  </FieldLabel>
                  <Input
                    id="security-current"
                    type="password"
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    aria-invalid={!!currentError}
                  />
                  {currentError && <FieldError>{currentError}</FieldError>}
                </Field>
                <Field data-invalid={!!nextError}>
                  <FieldLabel htmlFor="security-new">
                    Contraseña nueva
                  </FieldLabel>
                  <Input
                    id="security-new"
                    type="password"
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    aria-invalid={!!nextError}
                  />
                  {nextError ? (
                    <FieldError>{nextError}</FieldError>
                  ) : (
                    <FieldDescription>
                      Mínimo 10 caracteres, con minúscula, mayúscula y número.
                    </FieldDescription>
                  )}
                </Field>
                <Field data-invalid={!!confirmError}>
                  <FieldLabel htmlFor="security-confirm">
                    Repetí la contraseña nueva
                  </FieldLabel>
                  <Input
                    id="security-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={!!confirmError}
                  />
                  {confirmError && <FieldError>{confirmError}</FieldError>}
                </Field>
                <Button type="submit" disabled={pending} className="self-start">
                  {pending ? "Cambiando…" : "Cambiar contraseña"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sesiones</CardTitle>
            <CardDescription>
              Si perdiste un dispositivo o usaste uno ajeno, cerrá tus sesiones
              en todos lados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
              <ResponsiveDialogTrigger asChild>
                <Button variant="outline">Cerrar todas las sesiones</Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>
                    ¿Cerrar todas las sesiones?
                  </ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    Vas a salir de todos tus dispositivos, incluido este, y vas
                    a tener que volver a ingresar.
                  </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                {logoutError && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{logoutError}</AlertDescription>
                  </Alert>
                )}
                <ResponsiveDialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setLogoutOpen(false)}
                    disabled={logoutPending}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={logoutAll} disabled={logoutPending}>
                    {logoutPending ? "Cerrando…" : "Cerrar todas las sesiones"}
                  </Button>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
