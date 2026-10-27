import { describe, expect, it } from 'vitest';
import type { Contract, Strain } from '../engine';
import { contractLabel, dealRandom, mulberry32 } from '../engine';
import type { DDTable } from '../solver/solve';
import {
  MIN_NS_HCP,
  chooseContract,
  contractCandidates,
  isGameOrHigher,
  matchesType,
  nsHcp,
  passesHcpFilter,
  relaxContractType,
} from './contract';
import type { ContractType, DealSettings, Difficulty } from './settings';

const table = (t: Partial<DDTable>): DDTable => ({ C: 6, D: 6, H: 6, S: 6, NT: 6, ...t });
const c = (level: Contract['level'], strain: Strain): Contract => ({
  level,
  strain,
  declarer: 'S',
});

function pick(
  t: DDTable,
  contractType: ContractType,
  difficulty: Difficulty = 'exact',
  vulnerability: DealSettings['vulnerability'] = 'none',
): string | null {
  const best = chooseContract(t, { contractType, difficulty, vulnerability });
  return best ? `${contractLabel(best.contract)}=${best.score}` : null;
}

describe('HCP filter (6.1)', () => {
  it('uses the SPEC minimums', () => {
    expect(MIN_NS_HCP).toEqual({ any: 20, gameUp: 23, slam: 29, nt: 20, suit: 20 });
  });

  it('compares NS HCP with the minimum of the contract type', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const deal = dealRandom(rng);
      for (const type of ['any', 'gameUp', 'slam'] as const) {
        expect(passesHcpFilter(deal, type)).toBe(nsHcp(deal) >= MIN_NS_HCP[type]);
      }
    }
  });
});

describe('contract types', () => {
  it('knows which contracts are game', () => {
    expect(isGameOrHigher(c(3, 'NT'))).toBe(true);
    expect(isGameOrHigher(c(2, 'NT'))).toBe(false);
    expect(isGameOrHigher(c(4, 'S'))).toBe(true);
    expect(isGameOrHigher(c(4, 'H'))).toBe(true);
    expect(isGameOrHigher(c(3, 'S'))).toBe(false);
    expect(isGameOrHigher(c(5, 'D'))).toBe(true);
    expect(isGameOrHigher(c(4, 'C'))).toBe(false);
    expect(isGameOrHigher(c(7, 'C'))).toBe(true);
  });

  it('matches each type', () => {
    expect(matchesType(c(1, 'C'), 'any')).toBe(true);
    expect(matchesType(c(6, 'C'), 'gameUp')).toBe(true);
    expect(matchesType(c(5, 'NT'), 'slam')).toBe(false);
    expect(matchesType(c(6, 'NT'), 'slam')).toBe(true);
    expect(matchesType(c(7, 'S'), 'slam')).toBe(true);
    expect(matchesType(c(2, 'NT'), 'nt')).toBe(true);
    expect(matchesType(c(2, 'S'), 'nt')).toBe(false);
    expect(matchesType(c(2, 'S'), 'suit')).toBe(true);
    expect(matchesType(c(2, 'NT'), 'suit')).toBe(false);
  });

  it('relaxes slam → game → any, and NT / suit → any', () => {
    expect(relaxContractType('slam')).toBe('gameUp');
    expect(relaxContractType('gameUp')).toBe('any');
    expect(relaxContractType('nt')).toBe('any');
    expect(relaxContractType('suit')).toBe('any');
    expect(relaxContractType('any')).toBeNull();
  });
});

describe('contract candidates (6.2)', () => {
  it('skips strains below 7 tricks and bids the DD level', () => {
    const list = contractCandidates(table({ NT: 9, S: 10, D: 7 }), 'exact', false);
    expect(list.map((x) => contractLabel(x.contract))).toEqual(['3NT', '4♠', '1♦']);
    expect(list.map((x) => x.ddTricks)).toEqual([9, 10, 7]);
  });

  it('bids one level lower with a cushion, but never below 1', () => {
    const list = contractCandidates(table({ NT: 9, S: 13, D: 7 }), 'cushion', false);
    expect(list.map((x) => contractLabel(x.contract))).toEqual(['2NT', '6♠', '1♦']);
    // Scored as made with one overtrick (none for 1♦ on 7 tricks).
    expect(list.map((x) => x.score)).toEqual([150, 1010, 70]);
  });
});

describe('chooseContract (6.2)', () => {
  it('picks the highest score', () => {
    expect(pick(table({ NT: 9, S: 10, H: 8, D: 7, C: 7 }), 'any')).toBe('4♠=420');
    expect(pick(table({ NT: 9, S: 10, H: 8, D: 7, C: 7 }), 'any', 'cushion')).toBe('3♠=170');
  });

  it('scores with the NS vulnerability', () => {
    expect(pick(table({ S: 10 }), 'any', 'exact', 'ns')).toBe('4♠=620');
    expect(pick(table({ S: 12 }), 'any', 'exact', 'ns')).toBe('6♠=1430');
  });

  it('breaks ties NT > ♠ > ♥ > ♦ > ♣', () => {
    // 3NT and 5♦ both score 400.
    expect(pick(table({ NT: 9, D: 11 }), 'any')).toBe('3NT=400');
    expect(pick(table({ S: 10, H: 10 }), 'any')).toBe('4♠=420');
    expect(pick(table({ D: 11, C: 11 }), 'any')).toBe('5♦=400');
  });

  it('only takes contracts of the wanted type', () => {
    const t = table({ NT: 9, S: 12, C: 8 });
    expect(pick(t, 'slam')).toBe('6♠=980');
    expect(pick(t, 'nt')).toBe('3NT=400');
    expect(pick(t, 'suit')).toBe('6♠=980');
    expect(pick(table({ NT: 8, S: 9 }), 'gameUp')).toBeNull();
    expect(pick(table({ NT: 11 }), 'slam')).toBeNull();
    expect(pick(table({ NT: 8, S: 10 }), 'nt')).toBe('2NT=120');
    expect(pick(table({ NT: 10 }), 'suit')).toBeNull();
  });

  it('lowers the level before filtering by type with a cushion', () => {
    // 4♠ needs 11 tricks, 3NT needs 10, a slam needs 13.
    expect(pick(table({ S: 10, NT: 9 }), 'gameUp', 'cushion')).toBeNull();
    expect(pick(table({ S: 11 }), 'gameUp', 'cushion')).toBe('4♠=450');
    expect(pick(table({ NT: 10 }), 'gameUp', 'cushion')).toBe('3NT=430');
    expect(pick(table({ S: 12 }), 'slam', 'cushion')).toBeNull();
    expect(pick(table({ S: 13 }), 'slam', 'cushion')).toBe('6♠=1010');
  });

  it('finds nothing when NS takes fewer than 7 tricks everywhere', () => {
    expect(pick(table({}), 'any')).toBeNull();
  });
});
