/**
 * Simula la latencia de red para que los skeleton loaders se vean durante el
 * maquetado. Uso típico como queryFn provisoria:
 *
 *   useQuery({ queryKey: ["properties"], queryFn: () => withLatency(properties) })
 */
export function withLatency<T>(data: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}
