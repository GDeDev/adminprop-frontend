"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import type {
  ApiSuccess,
  DocumentKind,
  GeneratedDocument,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const POLL_EVERY_MS = 3_000
const POLL_MAX_MS = 30_000

export type DocumentOutcome =
  | { state: "ready"; url: string }
  | { state: "failed"; error: string | null }
  | { state: "timeout" }

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Pide el documento vigente. Si todavía se está generando (202/PENDING)
 * reintenta cada 3 s hasta 30 s. Un 404 se propaga: el documento nunca se pidió.
 */
export async function fetchDocument(
  kind: DocumentKind,
  entityId: string,
  { pollEveryMs = POLL_EVERY_MS, maxMs = POLL_MAX_MS } = {}
): Promise<DocumentOutcome> {
  const startedAt = Date.now()
  for (;;) {
    const { data } = await apiClient.get<ApiSuccess<GeneratedDocument>>(
      `/documents/${kind}/${entityId}`
    )
    const doc = data.data
    if (doc.status === "READY" && doc.url) {
      return { state: "ready", url: doc.url }
    }
    if (doc.status === "FAILED") return { state: "failed", error: doc.error }
    if (Date.now() - startedAt + pollEveryMs > maxMs) {
      return { state: "timeout" }
    }
    await wait(pollEveryMs)
  }
}

/** Encola una versión nueva del documento (sólo admin). */
export function useRegenerateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      kind,
      entityId,
    }: {
      kind: DocumentKind
      entityId: string
    }) => {
      const { data } = await apiClient.post<ApiSuccess<GeneratedDocument>>(
        `/documents/${kind}/${entityId}/regenerate`
      )
      return data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  })
}
