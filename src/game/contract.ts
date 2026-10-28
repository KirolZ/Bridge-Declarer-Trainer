// Choosing the contract for a deal from its double-dummy table (SPEC §7.1 steps 2–5).

import type { Contract, Deal, Level, Strain } from '../engine';
import { hcp, isDeclarerVulnerable, score } from '../engine';
import type { DDTable } from '../solver/solve';
import type { ContractType, DealSettings, Difficulty } from './settings';

/** Minimum NS HCP before a deal is worth solving (SPEC §7.1 step 2). */
export const MIN_NS_HCP: Readonly<Record<ContractType, number>> = {
  any: 20,
  gameUp: 23,
  slam: 29,
  nt: 20,
  suit: 20,
  noSlam: 20,
};

export function nsHcp(deal: Deal): number {
  return hcp(deal.N) + hcp(deal.S);
}

export function passesHcpFilter(deal: Deal, type: ContractType): boolean {
  return nsHcp(deal) >= MIN_NS_HCP[type];
}

/** Game contracts: tricks bid score ≥ 100 (3NT, 4♥ / 4♠, 5♣ / 5♦ and up). */
export function isGameOrHigher(contract: Contract): boolean {
  const { level, strain } = contract;
  if (strain === 'NT') return level >= 3;
  if (strain === 'H' || strain === 'S') return level >= 4;
  return level >= 5;
}

export function matchesType(contract: Contract, type: ContractType): boolean {
  switch (type) {
    case 'any':
      return true;
    case 'gameUp':
      return isGameOrHigher(contract);
    case 'slam':
      return contract.level >= 6;
    case 'nt':
      return contract.strain === 'NT';
    case 'suit':
      return contract.strain !== 'NT';
    case 'noSlam':
      return contract.level < 6;
  }
}

/** Preferred strain when two contracts score the same: NT > ♠ > ♥ > ♦ > ♣. */
const STRAIN_PREFERENCE: readonly Strain[] = ['NT', 'S', 'H', 'D', 'C'];

export type ContractCandidate = {
  readonly contract: Contract;
  /** Double-dummy tricks for NS in this strain. */
  readonly ddTricks: number;
  /** Score when declarer takes exactly `ddTricks`. */
  readonly score: number;
};

/**
 * One candidate per strain where NS can take ≥ 7 tricks, at the DD level (`exact`) or one
 * level lower when that is still ≥ 1 (`cushion`). In strain preference order.
 */
export function contractCandidates(
  table: DDTable,
  difficulty: Difficulty,
  vulnerable: boolean,
): ContractCandidate[] {
  const out: ContractCandidate[] = [];
  for (const strain of STRAIN_PREFERENCE) {
    const ddTricks = table[strain];
    if (ddTricks < 7) continue;
    const ddLevel = ddTricks - 6;
    const level = (difficulty === 'cushion' ? Math.max(1, ddLevel - 1) : ddLevel) as Level;
    const contract: Contract = { level, strain, declarer: 'S' };
    out.push({ contract, ddTricks, score: score(contract, ddTricks, vulnerable) });
  }
  return out;
}

/**
 * The highest-scoring candidate of the wanted type (ties go to the preferred strain), or
 * null when the deal has none.
 */
export function chooseContract(table: DDTable, settings: DealSettings): ContractCandidate | null {
  const vulnerable = isDeclarerVulnerable(settings.vulnerability);
  let best: ContractCandidate | null = null;
  for (const c of contractCandidates(table, settings.difficulty, vulnerable)) {
    if (!matchesType(c.contract, settings.contractType)) continue;
    // Candidates come in preference order, so only a strictly higher score replaces `best`.
    if (!best || c.score > best.score) best = c;
  }
  return best;
}

/** The next, looser contract type after 30 failed deals (SPEC §7.1 step 5); null = loosest. */
export function relaxContractType(type: ContractType): ContractType | null {
  switch (type) {
    case 'slam':
      return 'gameUp';
    case 'gameUp':
    case 'nt':
    case 'suit':
    case 'noSlam':
      return 'any';
    case 'any':
      return null;
  }
}
