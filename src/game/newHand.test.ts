import { beforeAll, describe, expect, it } from 'vitest';
import type { Deal } from '../engine';
import { cardCode, hcp, mulberry32, tricksNeeded, validateDeal } from '../engine';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import type { DDTable } from '../solver/solve';
import { MIN_NS_HCP, matchesType, nsHcp } from './contract';
import type { DdTableFn } from './newHand';
import { DD_TABLE_TIMEOUT_MS, MAX_SOLVED_DEALS, NoDealError, newHand } from './newHand';
import type { ContractType, DealSettings, Difficulty } from './settings';
import { CONTRACT_TYPES } from './settings';

const flat = (n: number): DDTable => ({ C: n, D: n, H: n, S: n, NT: n });
const dealKey = (d: Deal) =>
  (['N', 'E', 'S', 'W'] as const).map((s) => d[s].map(cardCode).join(''));

/** A fake solver that records the deals it was given. */
function fake(answer: (call: number, deal: Deal) => DDTable) {
  const deals: Deal[] = [];
  const timeouts: number[] = [];
  const fn: DdTableFn = (deal, { timeoutMs }) => {
    deals.push(deal);
    timeouts.push(timeoutMs);
    return answer(deals.length, deal);
  };
  return { fn, deals, timeouts };
}

class FakeTimeout extends Error {
  override name = 'SolverTimeoutError';
}

const settings = (contractType: ContractType, difficulty: Difficulty = 'exact'): DealSettings => ({
  contractType,
  difficulty,
  vulnerability: 'none',
});

describe('newHand with a fake solver', () => {
  it('only solves deals that pass the HCP filter, stronger hand in South', async () => {
    const solver = fake((call) => (call < 5 ? flat(6) : flat(12)));
    await newHand(settings('slam'), { ddTable: solver.fn, rng: mulberry32(1) });
    expect(solver.deals).toHaveLength(5);
    for (const deal of solver.deals) {
      expect(validateDeal(deal, { full: true })).toBeNull();
      expect(nsHcp(deal)).toBeGreaterThanOrEqual(MIN_NS_HCP.slam);
      expect(hcp(deal.S)).toBeGreaterThanOrEqual(hcp(deal.N));
    }
  });

  it('returns the solved deal, its table and the chosen contract', async () => {
    const solver = fake(() => ({ C: 7, D: 8, H: 10, S: 9, NT: 9 }));
    const hand = await newHand(settings('any'), { ddTable: solver.fn, rng: mulberry32(2) });
    expect(hand.deal).toBe(solver.deals[0]);
    expect(hand.ddTable).toEqual({ C: 7, D: 8, H: 10, S: 9, NT: 9 });
    expect(hand.contract).toEqual({ level: 4, strain: 'H', declarer: 'S' });
    expect(hand.ddTricks).toBe(10);
    expect(hand).toMatchObject({ contractType: 'any', relaxed: false, solvedDeals: 1 });
  });

  it('is reproducible with a seeded RNG', async () => {
    const a = fake(() => flat(9));
    const b = fake(() => flat(9));
    await newHand(settings('any'), { ddTable: a.fn, rng: mulberry32(42) });
    await newHand(settings('any'), { ddTable: b.fn, rng: mulberry32(42) });
    expect(dealKey(a.deals[0] as Deal)).toEqual(dealKey(b.deals[0] as Deal));
  });

  it('passes a 5 s time limit and skips deals that time out', async () => {
    const solver = fake((call) => {
      if (call <= 2) throw new FakeTimeout('slow');
      return flat(9);
    });
    const hand = await newHand(settings('any'), { ddTable: solver.fn, rng: mulberry32(3) });
    expect(solver.timeouts).toEqual([
      DD_TABLE_TIMEOUT_MS,
      DD_TABLE_TIMEOUT_MS,
      DD_TABLE_TIMEOUT_MS,
    ]);
    expect(hand.deal).toBe(solver.deals[2]);
    expect(hand.solvedDeals).toBe(3);
    expect(hand.relaxed).toBe(false);
  });

  it('relaxes slam to game after 30 solved deals and says so (6.3)', async () => {
    const solver = fake(() => flat(9));
    const hand = await newHand(settings('slam'), { ddTable: solver.fn, rng: mulberry32(4) });
    expect(MAX_SOLVED_DEALS).toBe(30);
    expect(hand.solvedDeals).toBe(31);
    expect(hand).toMatchObject({ contractType: 'gameUp', relaxed: true });
    expect(hand.contract).toEqual({ level: 3, strain: 'NT', declarer: 'S' });
    // The relaxed deal only needs the game HCP minimum.
    expect(nsHcp(hand.deal)).toBeGreaterThanOrEqual(MIN_NS_HCP.gameUp);
  });

  it('relaxes all the way to any, counting timeouts as misses', async () => {
    const solver = fake((call) => {
      if (call % 2) throw new FakeTimeout('slow');
      return flat(8);
    });
    // 8 tricks: no slam, no game. 30 misses each, then call 61 times out and 62 gives 2NT.
    const hand = await newHand(settings('slam'), { ddTable: solver.fn, rng: mulberry32(5) });
    expect(hand).toMatchObject({ contractType: 'any', relaxed: true, solvedDeals: 62 });
    expect(hand.contract).toEqual({ level: 2, strain: 'NT', declarer: 'S' });
  });

  it('relaxes NT only to any', async () => {
    const solver = fake(() => ({ ...flat(6), S: 10 }));
    const hand = await newHand(settings('nt'), { ddTable: solver.fn, rng: mulberry32(6) });
    expect(hand).toMatchObject({ contractType: 'any', relaxed: true, solvedDeals: 31 });
    expect(hand.contract.strain).toBe('S');
  });

  it('gives up when even "any" finds nothing', async () => {
    const solver = fake(() => flat(6));
    await expect(
      newHand(settings('any'), { ddTable: solver.fn, rng: mulberry32(7) }),
    ).rejects.toBeInstanceOf(NoDealError);
    expect(solver.deals).toHaveLength(MAX_SOLVED_DEALS);
  });

  it('rethrows solver errors that are not timeouts', async () => {
    const solver = fake(() => {
      throw new Error('worker crashed');
    });
    await expect(
      newHand(settings('any'), { ddTable: solver.fn, rng: mulberry32(8) }),
    ).rejects.toThrow('worker crashed');
  });

  it('can be cancelled before it starts', async () => {
    const solver = fake(() => flat(9));
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(
      newHand(settings('any'), { ddTable: solver.fn, rng: mulberry32(9), signal: ctrl.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(solver.deals).toHaveLength(0);
  });

  it('can be cancelled while the solver runs', async () => {
    const ctrl = new AbortController();
    const solver = fake(() => {
      ctrl.abort();
      const err = new Error('cancelled');
      err.name = 'AbortError';
      throw err;
    });
    await expect(
      newHand(settings('any'), { ddTable: solver.fn, rng: mulberry32(10), signal: ctrl.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(solver.deals).toHaveLength(1);
  });

  it('stops even if the solver ignores the abort and answers', async () => {
    const ctrl = new AbortController();
    const solver = fake(() => {
      ctrl.abort();
      return flat(9);
    });
    await expect(
      newHand(settings('any'), { ddTable: solver.fn, rng: mulberry32(11), signal: ctrl.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('newHand with DDS (6.4)', () => {
  let dds: DdsSolver;
  beforeAll(async () => {
    dds = await loadDds();
  });

  const cases = CONTRACT_TYPES.flatMap((type) =>
    (['exact', 'cushion'] as const).flatMap((difficulty) =>
      [1, 2].map((seed) => ({ type, difficulty, seed })),
    ),
  );

  it.each(cases)(
    '$type / $difficulty (seed $seed): contract matches and DD makes it',
    async ({ type, difficulty, seed }) => {
      const vulnerability = seed % 2 ? 'none' : 'ns';
      const hand = await newHand(
        { contractType: type, difficulty, vulnerability },
        { ddTable: (deal) => dds.ddTable(deal), rng: mulberry32(1000 + seed) },
      );
      const { deal, contract, ddTable } = hand;
      expect(validateDeal(deal, { full: true })).toBeNull();
      expect(hcp(deal.S)).toBeGreaterThanOrEqual(hcp(deal.N));
      expect(ddTable).toEqual(dds.ddTable(deal));
      expect(hand.ddTricks).toBe(ddTable[contract.strain]);
      expect(hand.relaxed).toBe(false);
      expect(matchesType(contract, type)).toBe(true);

      const need = tricksNeeded(contract);
      expect(hand.ddTricks).toBeGreaterThanOrEqual(need);
      if (difficulty === 'exact') expect(hand.ddTricks).toBe(need);
      // A cushion is one overtrick, except 1-level contracts on exactly 7 tricks.
      else if (contract.level > 1 || hand.ddTricks > 7) expect(hand.ddTricks).toBe(need + 1);
    },
    30_000,
  );
});
