import * as React from "react"
import { cn } from "cn"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"

/** Placeholder de pantalla todavía no implementada. */
function ComingSoon({
  title,
  description = "Próximamente.",
  className,
}: {
  title: string
  description?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export { ComingSoon }
