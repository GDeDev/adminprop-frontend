"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  AnalyzeTokkoRequest,
  ApiSuccess,
  ConfirmImportRequest,
  ImportBatchDetail,
  ImportBatchStatus,
  ImportBatchSummary,
  ImportEntity,
  ImportRowDto,
  ImportRowStatus,
  ImportSource,
  Paginated,
  RetryAssetsResult,
  StartMigrationResult,
  UpdateImportRowRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"
import { isBatchRunning } from "./migration"

const PAGE_SIZE = 20
export const migrationKey = ["migration"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

export interface BatchFilters {
  source?: ImportSource
  status?: ImportBatchStatus
}

export interface RowFilters {
  entity?: ImportEntity
  status?: ImportRowStatus
  needsReview?: boolean
}

function clean(filters: object) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  )
}

/** Descarga un archivo de la API por blob (para mandar el token). */
async function download(url: string, filename: string): Promise<void> {
  const response = await apiClient.get<Blob>(url, { responseType: "blob" })
  const objectUrl = URL.createObjectURL(response.data)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export function downloadExcelTemplate() {
  return download("/migration/excel/template", "plantilla-migracion.xlsx")
}

export function downloadBatchReport(batchId: string) {
  return download(
    `/migration/batches/${batchId}/report.xlsx`,
    `reporte-migracion-${batchId}.xlsx`
  )
}

export function useAnalyzeExcel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return unwrap<StartMigrationResult>(
        apiClient.post("/migration/excel/analyze", form)
      )
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...migrationKey, "batches"] }),
  })
}

export function useAnalyzeTokko() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AnalyzeTokkoRequest) =>
      unwrap<StartMigrationResult>(
        apiClient.post("/migration/tokko/analyze", body)
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...migrationKey, "batches"] }),
  })
}

export function useInfiniteBatches(filters: BatchFilters) {
  return useInfiniteQuery({
    queryKey: [...migrationKey, "batches", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<ImportBatchSummary>>
      >("/migration/batches", {
        params: { ...clean(filters), page: pageParam, limit: PAGE_SIZE },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

/** Detalle del lote; se vuelve a consultar cada 2 s mientras analiza o importa. */
export function useBatch(id: string) {
  return useQuery({
    queryKey: [...migrationKey, "batch", id],
    queryFn: () =>
      unwrap<ImportBatchDetail>(apiClient.get(`/migration/batches/${id}`)),
    refetchInterval: (query) =>
      isBatchRunning(query.state.data?.status) ? 2_000 : false,
  })
}

export function useInfiniteRows(batchId: string, filters: RowFilters) {
  return useInfiniteQuery({
    queryKey: [...migrationKey, "rows", batchId, filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<ApiSuccess<Paginated<ImportRowDto>>>(
        `/migration/batches/${batchId}/rows`,
        { params: { ...clean(filters), page: pageParam, limit: PAGE_SIZE } }
      )
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

function useInvalidateAll() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: migrationKey })
}

export function useUpdateRow(batchId: string) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({
      rowId,
      ...body
    }: UpdateImportRowRequest & { rowId: string }) =>
      unwrap<ImportRowDto>(
        apiClient.patch(`/migration/batches/${batchId}/rows/${rowId}`, body)
      ),
    onSuccess: invalidate,
  })
}

export function useConfirmBatch(batchId: string) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (body: ConfirmImportRequest) =>
      unwrap<StartMigrationResult>(
        apiClient.post(`/migration/batches/${batchId}/confirm`, body)
      ),
    onSuccess: invalidate,
  })
}

export function useDiscardBatch(batchId: string) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: () =>
      unwrap<unknown>(apiClient.post(`/migration/batches/${batchId}/discard`)),
    onSuccess: invalidate,
  })
}

export function useRetryAssets(batchId: string) {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: () =>
      unwrap<RetryAssetsResult>(
        apiClient.post(`/migration/batches/${batchId}/assets/retry`)
      ),
    onSuccess: invalidate,
  })
}
