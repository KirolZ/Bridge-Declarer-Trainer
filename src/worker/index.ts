// The app's solver: every solve / analyze / ddTable runs in one Web Worker (SPEC §5.5).

import type { WorkerLike } from './client';
import { SolverClient } from './client';

export type { JobOptions, SolverClientOptions, WorkerLike } from './client';
export {
  SolverAbortError,
  SolverClient,
  SolverError,
  SolverTimeoutError,
  isAbortError,
} from './client';

function createSolverWorker(): WorkerLike {
  const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
    type: 'module',
    name: 'solver',
  });
  return worker as unknown as WorkerLike;
}

let client: SolverClient | null = null;

/** The shared solver client; its worker starts on the first job (or `warmUp()`). */
export function getSolver(): SolverClient {
  return (client ??= new SolverClient({ createWorker: createSolverWorker }));
}
