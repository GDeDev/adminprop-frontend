"use client"

import { useQuery } from "@tanstack/react-query"

import type { ApiSuccess, AsyncJobStatus } from "@adminprop/shared-types"

import { apiClient } from "./api-client"

export const jobsKey = ["jobs"] as const

const FINISHED: AsyncJobStatus["status"][] = [
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
]

export function isJobFinished(status: AsyncJobStatus["status"]): boolean {
  return FINISHED.includes(status)
}

/**
 * Estado de un trabajo en background (`GET /jobs/:id/status`). Consulta cada
 * 2 s mientras no termine; con `jobId` nulo no hace nada.
 */
export function useJobStatus(jobId: string | null, pollEveryMs = 2_000) {
  return useQuery({
    queryKey: [...jobsKey, jobId],
    enabled: jobId !== null,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<AsyncJobStatus>>(
        `/jobs/${jobId}/status`
      )
      return data.data
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && isJobFinished(status) ? false : pollEveryMs
    },
  })
}
