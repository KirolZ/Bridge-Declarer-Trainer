// Duplicate scoring without doubles (SPEC §4.3).

import type { Contract, Strain } from './card';
import { tricksNeeded } from './card';

export type Vulnerability = 'none' | 'ns';

export type ScoreBreakdown = {
  made: boolean;
  /** Tricks over the contract (positive) or short of it (negative). */
  result: number;
  /** Points for the tricks bid (0 if the contract failed). */
  contractPoints: number;
  overtrickPoints: number;
  /** 300 / 500 for a game, 50 for a partscore. */
  gameBonus: number;
  /** 500 / 750 small slam, 1000 / 1500 grand slam. */
  slamBonus: number;
  /** Negative: 50 / 100 per undertrick. */
  undertrickPoints: number;
  /** Score for the declaring side (negative when the contract fails). */
  total: number;
};

/** Points for the first `level` tricks over book in `strain`. */
function trickPoints(strain: Strain, level: number): number {
  if (strain === 'NT') return 40 + 30 * (level - 1);
  return (strain === 'C' || strain === 'D' ? 20 : 30) * level;
}

function perOvertrick(strain: Strain): number {
  return strain === 'C' || strain === 'D' ? 20 : 30;
}

function slamBonusFor(level: number, vulnerable: boolean): number {
  if (level === 7) return vulnerable ? 1500 : 1000;
  if (level === 6) return vulnerable ? 750 : 500;
  return 0;
}

/** Score for South (the declarer) taking `tricks` tricks in `contract`. */
export function scoreBreakdown(
  contract: Contract,
  tricks: number,
  vulnerable: boolean,
): ScoreBreakdown {
  if (!Number.isInteger(tricks) || tricks < 0 || tricks > 13) {
    throw new RangeError(`tricks must be 0–13, got ${tricks}`);
  }
  const result = tricks - tricksNeeded(contract);
  if (result < 0) {
    const undertrickPoints = result * (vulnerable ? 100 : 50);
    return {
      made: false,
      result,
      contractPoints: 0,
      overtrickPoints: 0,
      gameBonus: 0,
      slamBonus: 0,
      undertrickPoints,
      total: undertrickPoints,
    };
  }
  const contractPoints = trickPoints(contract.strain, contract.level);
  const overtrickPoints = result * perOvertrick(contract.strain);
  const gameBonus = contractPoints >= 100 ? (vulnerable ? 500 : 300) : 50;
  const slamBonus = slamBonusFor(contract.level, vulnerable);
  return {
    made: true,
    result,
    contractPoints,
    overtrickPoints,
    gameBonus,
    slamBonus,
    undertrickPoints: 0,
    total: contractPoints + overtrickPoints + gameBonus + slamBonus,
  };
}

export function score(contract: Contract, tricks: number, vulnerable: boolean): number {
  return scoreBreakdown(contract, tricks, vulnerable).total;
}

/** NS is the declaring side, so NS vulnerability is what counts for scoring. */
export function isDeclarerVulnerable(vul: Vulnerability): boolean {
  return vul === 'ns';
}
