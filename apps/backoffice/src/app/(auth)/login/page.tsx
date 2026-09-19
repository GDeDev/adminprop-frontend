import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"

import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Ingresar" }

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Ingresar</CardTitle>
        <CardDescription>Accedé con tu email y contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
