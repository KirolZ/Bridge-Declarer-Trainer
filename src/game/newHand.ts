// Dealing a new hand and its contract (SPEC §7.1). Pure logic: the double-dummy table comes
// from a function the caller passes (the app: the solver worker; tests: DDS directly).

import type { Contract, Deal } from '../engine';
import { cryptoRng, dealRandom, withStrongerSouth } from '../engine';
import type { Rng } from '../engine';
import type { DDTable } from '../solver/solve';
import { chooseContract, passesHcpFilter, relaxContractType } from './contract';
import type { ContractType, DealSettings } from './settings';

/** Deals sent to the solver per contract type before relaxing it (SPEC §7.1 step 5). */
export const MAX_SOLVED_DEALS = 30;

/** Time limit for one deal's `ddTable`; a slower deal is skipped (about 1 in 1,000). */
export const DD_TABLE_TIMEOUT_MS = 5_000;

/** Safety net for the HCP filter loop (slam needs ≥ 29 HCP: ~5% of deals pass). */
const MAX_FILTERED_DEALS = 100_000;

export type DdTableFn = (
  deal: Deal,
  options: { signal?: AbortSignal; timeoutMs: number },
) => Promise<DDTable> | DDTable;

export type NewHandOptions = {
  ddTable: DdTableFn;
  /** Defaults to crypto randomness; pass a seeded RNG for reproducible deals. */
  rng?: Rng;
  signal?: AbortSignal;
  /** Per-deal `ddTable` time limit (default `DD_TABLE_TIMEOUT_MS`). */
  timeoutMs?: number;
};

export type NewHand = {
  readonly deal: Deal;
  readonly contract: Contract;
  readonly ddTable: DDTable;
  /** NS double-dummy tricks in the contract's strain. */
  readonly ddTricks: number;
  /** The contract type the hand was chosen for: the setting, or a looser one if relaxed. */
  readonly contractType: ContractType;
  /** True when no deal matched the setting in time and a looser type was used. */
  readonly relaxed: boolean;
  /** How many deals went to the solver. */
  readonly solvedDeals: number;
};

/** Thrown when even the loosest contract type found nothing (should never happen). */
export class NoDealError extends Error {
  override name = 'NoDealError';
}

function isTimeout(err: unknown): boolean {
  return err instanceof Error && /timeout/i.test(err.name);
}

/** Next deal from `rng` (stronger hand in South) that passes the HCP filter. */
function filteredDeal(rng: Rng, type: ContractType, signal: AbortSignal | undefined): Deal {
  for (let i = 0; i < MAX_FILTERED_DEALS; i++) {
    signal?.throwIfAborted();
    const deal = withStrongerSouth(dealRandom(rng));
    if (passesHcpFilter(deal, type)) return deal;
  }
  throw new NoDealError(`no deal passed the HCP filter for "${type}"`);
}

/**
 * Deals until the solver confirms a contract matching `settings` (SPEC §7.1). After
 * `MAX_SOLVED_DEALS` misses the contract type is relaxed (slam → game → any, NT / suit → any)
 * and `relaxed` is set so the UI can tell the player. A deal whose `ddTable` times out counts
 * as a miss. Aborting `signal` rejects with its reason (an `AbortError`).
 */
export async function newHand(settings: DealSettings, options: NewHandOptions): Promise<NewHand> {
  const { signal } = options;
  const rng = options.rng ?? cryptoRng();
  const timeoutMs = options.timeoutMs ?? DD_TABLE_TIMEOUT_MS;
  let type: ContractType | null = settings.contractType;
  let solvedDeals = 0;

  while (type) {
    for (let miss = 0; miss < MAX_SOLVED_DEALS; miss++) {
      const deal = filteredDeal(rng, type, signal);
      solvedDeals++;
      let table: DDTable;
      try {
        table = await options.ddTable(deal, { signal, timeoutMs });
      } catch (err) {
        signal?.throwIfAborted();
        if (isTimeout(err)) continue;
        throw err;
      }
      signal?.throwIfAborted();
      const pick = chooseContract(table, { ...settings, contractType: type });
      if (pick) {
        return {
          deal,
          contract: pick.contract,
          ddTable: table,
          ddTricks: pick.ddTricks,
          contractType: type,
          relaxed: type !== settings.contractType,
          solvedDeals,
        };
      }
    }
    type = relaxContractType(type);
  }
  throw new NoDealError('no contract found');
}
