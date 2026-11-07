import { availableParallelism } from "node:os"

/**
 * Lo que comparten las configs de vitest de cada paquete.
 *
 * `turbo run test` corre los seis paquetes a la vez y cada vitest, por
 * defecto, abre un worker por núcleo: 6 × núcleos workers sobre los mismos
 * núcleos. Con esa sobresuscripción los tests que escriben con userEvent o
 * esperan un debounce superan los timeouts por defecto (5 s por test, 1 s en
 * `waitFor`/`findBy*`) y caen al azar. Acá se acota cuántos workers usa cada
 * paquete y se dan timeouts holgados; los tests no cambian.
 *
 * `VITEST_MAX_WORKERS` lo pisa (CI, o una máquina con pocos núcleos).
 *
 * El pool es `threads` y no `forks`: con la máquina cargada (la suite e2e del
 * backend y su Postgres suelen correr a la vez) arrancar un proceso por
 * archivo llegaba a fallar con "Failed to start forks worker"; un hilo por
 * archivo arranca en milisegundos y comparte el proceso.
 */
export function sharedMaxWorkers(): number {
  const fromEnv = Number(process.env.VITEST_MAX_WORKERS)
  if (Number.isInteger(fromEnv) && fromEnv > 0) return fromEnv
  return Math.max(1, Math.floor(availableParallelism() / 4))
}

export const sharedTest = {
  passWithNoTests: true,
  pool: "threads",
  maxWorkers: sharedMaxWorkers(),
  testTimeout: 30_000,
  hookTimeout: 30_000,
} as const
