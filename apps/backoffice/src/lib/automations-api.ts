"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  IndexStatus,
  InternalAlert,
  Job,
  JobExecution,
  JobExecutionStatus,
  Paginated,
  RunJobResult,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 20
export const automationsKey = ["automations"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

export function useJobs() {
  return useQuery({
    queryKey: [...automationsKey, "jobs"],
    queryFn: () => unwrap<Job[]>(apiClient.get("/automations/jobs")),
    // Una ejecución en curso cambia de estado sola: se refresca cada medio minuto.
    refetchInterval: 30_000,
  })
}

export interface ExecutionFilters {
  job?: string
  status?: JobExecutionStatus
  from?: string
  to?: string
}

export function useInfiniteExecutions(filters: ExecutionFilters) {
  return useInfiniteQuery({
    queryKey: [...automationsKey, "executions", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<ApiSuccess<Paginated<JobExecution>>>(
        "/automations/executions",
        { params: { ...filters, page: pageParam, limit: PAGE_SIZE } }
      )
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

/** Encola una ejecución manual; la API responde 202 con el id. */
export function useRunJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ job, period }: { job: string; period?: string }) =>
      unwrap<RunJobResult>(
        apiClient.post(`/automations/jobs/${job}/run`, period ? { period } : {})
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationsKey })
    },
  })
}

export function useInfiniteAlerts(unreadOnly: boolean) {
  return useInfiniteQuery({
    queryKey: [...automationsKey, "alerts", unreadOnly],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<InternalAlert>>
      >("/automations/alerts", {
        params: {
          unreadOnly: unreadOnly || undefined,
          page: pageParam,
          limit: PAGE_SIZE,
        },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap<InternalAlert>(apiClient.patch(`/automations/alerts/${id}/read`)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...automationsKey, "alerts"],
      })
    },
  })
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      unwrap<{ updated: number }>(
        apiClient.post("/automations/alerts/read-all")
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...automationsKey, "alerts"],
      })
    },
  })
}

export function useIndexStatus() {
  return useQuery({
    queryKey: [...automationsKey, "index-status"],
    queryFn: () => unwrap<IndexStatus[]>(apiClient.get("/indices/status")),
  })
}
