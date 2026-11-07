import type { Metadata } from "next"

import { BatchScreen } from "../batch-screen"

export const metadata: Metadata = { title: "Lote de migración" }

export default async function Page({
  params,
  searchParams,
}: PageProps<"/configuracion/migracion/[id]">) {
  const { id } = await params
  const { job } = await searchParams
  return <BatchScreen id={id} jobId={typeof job === "string" ? job : null} />
}
