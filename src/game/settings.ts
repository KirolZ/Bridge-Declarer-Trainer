// Deal settings (SPEC §7.1, §7.6). Only the fields dealing needs; M11 adds the rest.

import type { Vulnerability } from '../engine';

/** Which contracts a new deal may give (SPEC §7.1 step 4). */
export type ContractType = 'any' | 'gameUp' | 'slam' | 'nt' | 'suit';

/** `exact`: contract = DD maximum. `cushion`: one level lower when possible. */
export type Difficulty = 'exact' | 'cushion';

export type DealSettings = {
  readonly contractType: ContractType;
  readonly difficulty: Difficulty;
  readonly vulnerability: Vulnerability;
};

export const CONTRACT_TYPES: readonly ContractType[] = ['any', 'gameUp', 'slam', 'nt', 'suit'];

export const DEFAULT_DEAL_SETTINGS: DealSettings = {
  contractType: 'any',
  difficulty: 'exact',
  vulnerability: 'none',
};
