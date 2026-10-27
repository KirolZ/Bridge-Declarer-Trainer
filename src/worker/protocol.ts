// Messages between the main thread and the solver Web Worker (SPEC §5.5).
//
//   main → worker   { id, type: 'solve' | 'analyze' | 'ddTable', payload }
//   worker → main   { id, ok: true, result } | { id, ok: false, error }

import type { Deal } from '../engine';
import type { CardAnalysis, DDTable, Position } from '../solver';

/** Payload and result of each job type. */
export type SolverJobs = {
  solve: { payload: Position; result: number };
  analyze: { payload: Position; result: CardAnalysis[] };
  ddTable: { payload: Deal; result: DDTable };
};

export type JobType = keyof SolverJobs;
export type JobResult<T extends JobType> = SolverJobs[T]['result'];

export type SolverRequest = {
  [T in JobType]: { id: number; type: T; payload: SolverJobs[T]['payload'] };
}[JobType];

export type SolverResponse =
  { id: number; ok: true; result: JobResult<JobType> } | { id: number; ok: false; error: string };
