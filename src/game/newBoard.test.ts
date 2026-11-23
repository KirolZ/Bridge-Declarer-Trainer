import { beforeAll, describe, expect, it } from 'vitest';
import type { Deal, Seat, Strain } from '../engine';
import {
  SEATS,
  auctionError,
  auctionResult,
  dealRandom,
  mulberry32,
  rotateDeal,
  validateDeal,
} from '../engine';
import { bidDeal } from '../bidding';
import type { DdsSolver } from '../solver/dds';
import { loadDds } from '../solver/dds';
import type { DDTable } from '../solver/solve';
import { MIN_NS_HCP, matchesType, nsHcp } from './contract';
import type { Board, BidBoard, RejectReason, SolveFn } from './newBoard';
import { bidBoard, makesAtDifficulty, newBoard } from './newBoard';
import { DD_TABLE_TIMEOUT_MS, MAX_SOLVED_DEALS } from './newHand';
import type { ContractType, DealSettings, Difficulty } from './settings';
import { CONTRACT_TYPES } from './settings';

const settings = (
  contractType: ContractType,
  difficulty: Difficulty = 'exact',
  showAuction = true,
): DealSettings => ({ contractType, difficulty, vulnerability: 'none', showAuction });

const flat = (n: number): DDTable => ({ C: n, D: n, H: n, S: n, NT: n });

/** A fake `solve` that records what it was given. */
function fakeSolve(answer: (call: number, deal: Deal, strain: Strain) => number) {
  const calls: { deal: Deal; strain: Strain; timeoutMs: number }[] = [];
  const fn: SolveFn = (deal, strain, { timeoutMs }) => {
    calls.push({ deal, strain, timeoutMs });
    return answer(calls.length, deal, strain);
  };
  return { fn, calls };
}

const noTable = () => {
  throw new Error('ddTable must not be called');
};

class FakeTimeout extends Error {
  override name = 'SolverTimeoutError';
}

/** The first seeded deal (and dealer) whose auction ends as `want` says. */
function findDeal(want: (declarer: Seat | null, board: BidBoard | RejectReason) => boolean) {
  const rng = mulberry32(77);
  for (let i = 0; i < 5000; i++) {
    const deal = dealRandom(rng);
    const dealer = SEATS[i % 4]!;
    const { auction } = bidDeal(deal, dealer, 'none');
    const result = auctionResult(auction);
    const board = bidBoard(deal, dealer, 'none');
    if (want(result?.declarer ?? null, board)) return { deal, dealer, auction, board };
  }
  throw new Error('no such deal');
}

/** The shown auction is the one the bidder makes on the shown deal (rotation changes nothing). */
function expectHonestAuction(board: Board): void {
  const { auction } = board;
  expect(auction).not.toBeNull();
  expect(auctionError(auction!)).toBeNull();
  expect(auctionResult(auction!)).toEqual({ ...board.contract, doubling: 0 });
  const again = bidDeal(board.deal, auction!.dealer, 'none');
  expect(again.auction.calls).toEqual(auction!.calls);
  expect(again.steps.every((s) => s.rule !== 'fallback')).toBe(true);
}

describe('bidBoard', () => {
  it('keeps a board South declares as it is', () => {
    const { deal, auction, board } = findDeal((d, b) => d === 'S' && typeof b !== 'string');
    const { level, strain } = auctionResult(auction)!;
    expect(board).toEqual({ deal, auction, contract: { level, strain, declarer: 'S' } });
  });

  it('turns a board North declares round, auction and all', () => {
    const { deal, dealer, auction, board } = findDeal((d, b) => d === 'N' && typeof b !== 'string');
    const b = board as BidBoard;
    expect(b.deal).toEqual(rotateDeal(deal));
    expect(b.auction.dealer).toBe({ N: 'S', E: 'W', S: 'N', W: 'E' }[dealer]);
    expect(b.auction.calls).toEqual(auction.calls);
    const { level, strain } = auctionResult(auction)!;
    expect(b.contract).toEqual({ level, strain, declarer: 'S' });
    expect(auctionResult(b.auction)!.declarer).toBe('S');
  });

  it('drops boards the defenders declare and passed-out boards', () => {
    expect(findDeal((d) => d === 'E' || d === 'W').board).toBe('defenders');
    expect(findDeal((d) => d === null).board).toBe('passedOut');
  });

  it('a pair bids slam only with 33+ HCP, so the slam HCP filter drops no board', () => {
    const rng = mulberry32(5);
    let slams = 0;
    for (let i = 0; i < 20_000; i++) {
      const board = bidBoard(dealRandom(rng), SEATS[i % 4]!, i % 2 ? 'ns' : 'none');
      if (typeof board === 'string' || board.contract.level < 6) continue;
      slams++;
      expect(nsHcp(board.deal)).toBeGreaterThanOrEqual(33);
    }
    expect(slams).toBeGreaterThan(10);
    expect(MIN_NS_HCP.slam).toBeLessThan(33);
  });

  it('makesAtDifficulty: exact = no trick to spare, cushion = one or more', () => {
    const c = { level: 4, strain: 'S', declarer: 'S' } as const;
    expect(makesAtDifficulty(c, 10, 'exact')).toBe(true);
    expect(makesAtDifficulty(c, 11, 'exact')).toBe(false);
    expect(makesAtDifficulty(c, 9, 'exact')).toBe(false);
    expect(makesAtDifficulty(c, 10, 'cushion')).toBe(false);
    expect(makesAtDifficulty(c, 11, 'cushion')).toBe(true);
    expect(makesAtDifficulty(c, 13, 'cushion')).toBe(true);
  });
});

describe('newBoard with a fake solver', () => {
  it('solves only bid boards South declares, in the contract strain, with a 5 s limit', async () => {
    const solver = fakeSolve(() => 13);
    const rejects: RejectReason[] = [];
    const board = await newBoard(settings('any', 'cushion'), {
      solve: solver.fn,
      ddTable: noTable,
      rng: mulberry32(1),
      onReject: (r) => rejects.push(r),
    });
    // 13 tricks are a cushion for anything below a grand slam: the first board is kept.
    expect(solver.calls).toHaveLength(1);
    expect(solver.calls[0]).toMatchObject({
      deal: board.deal,
      strain: board.contract.strain,
      timeoutMs: DD_TABLE_TIMEOUT_MS,
    });
    expect(board).toMatchObject({
      ddTricks: 13,
      relaxed: false,
      withoutAuction: false,
      solvedDeals: 1,
      contractType: 'any',
    });
    expect(board.biddenDeals).toBe(rejects.length + 1);
    expect(rejects).not.toContain('dd');
    expect(validateDeal(board.deal, { full: true })).toBeNull();
    expectHonestAuction(board);
  });

  it('keeps an exact board only when DD equals the tricks needed', async () => {
    const solver = fakeSolve(() => 9);
    const board = await newBoard(settings('any'), {
      solve: solver.fn,
      ddTable: noTable,
      rng: mulberry32(2),
    });
    expect(board.contract.level).toBe(3);
    expect(board.solvedDeals).toBe(solver.calls.length);
    expectHonestAuction(board);
  });

  it('sends only boards of the wanted type to the solver', async () => {
    const strains: Strain[] = [];
    const solver = fakeSolve((_, deal, strain) => {
      strains.push(strain);
      expect(nsHcp(deal)).toBeGreaterThanOrEqual(33);
      return strains.length < 3 ? 11 : 13;
    });
    const board = await newBoard(settings('slam', 'cushion'), {
      solve: solver.fn,
      ddTable: noTable,
      rng: mulberry32(3),
    });
    expect(board.contract.level).toBe(6);
    expect(board).toMatchObject({ solvedDeals: 3, relaxed: false, contractType: 'slam' });
    expect(matchesType(board.contract, 'slam')).toBe(true);
  });

  it('relaxes slam to game after 30 misses and says so', async () => {
    const solver = fakeSolve(() => 9);
    const board = await newBoard(settings('slam'), {
      solve: solver.fn,
      ddTable: noTable,
      rng: mulberry32(4),
    });
    expect(MAX_SOLVED_DEALS).toBe(30);
    expect(board).toMatchObject({ contractType: 'gameUp', relaxed: true, withoutAuction: false });
    expect(board.contract).toEqual({ level: 3, strain: 'NT', declarer: 'S' });
    expect(board.solvedDeals).toBeGreaterThan(30);
    expectHonestAuction(board);
  });

  it('counts timeouts as misses', async () => {
    const solver = fakeSolve((call) => {
      if (call <= 2) throw new FakeTimeout('slow');
      return 13;
    });
    const rejects: RejectReason[] = [];
    const board = await newBoard(settings('any', 'cushion'), {
      solve: solver.fn,
      ddTable: noTable,
      rng: mulberry32(5),
      onReject: (r) => rejects.push(r),
    });
    expect(board.solvedDeals).toBe(3);
    expect(rejects.filter((r) => r === 'timeout')).toHaveLength(2);
  });

  it('deals without an auction when even "any" misses, and says so', async () => {
    const solver = fakeSolve(() => 13); // exact 13 = grand slams only: never bid
    let tables = 0;
    const board = await newBoard(settings('any'), {
      solve: solver.fn,
      ddTable: () => {
        tables++;
        return flat(9);
      },
      rng: mulberry32(6),
    });
    expect(solver.calls).toHaveLength(MAX_SOLVED_DEALS);
    expect(board).toMatchObject({ auction: null, withoutAuction: true, relaxed: false });
    expect(board.contract).toEqual({ level: 3, strain: 'NT', declarer: 'S' });
    expect(board.solvedDeals).toBe(MAX_SOLVED_DEALS + tables);
  });

  it('deals the old way with the auction setting off', async () => {
    const solver = fakeSolve(() => 13);
    const board = await newBoard(settings('any', 'exact', false), {
      solve: solver.fn,
      ddTable: () => ({ C: 7, D: 8, H: 10, S: 9, NT: 9 }),
      rng: mulberry32(7),
    });
    expect(solver.calls).toHaveLength(0);
    expect(board).toMatchObject({
      auction: null,
      withoutAuction: false,
      biddenDeals: 0,
      solvedDeals: 1,
      contract: { level: 4, strain: 'H', declarer: 'S' },
    });
  });

  it('is reproducible with a seeded RNG', async () => {
    const a = await newBoard(settings('any', 'cushion'), {
      solve: () => 13,
      ddTable: noTable,
      rng: mulberry32(8),
    });
    const b = await newBoard(settings('any', 'cushion'), {
      solve: () => 13,
      ddTable: noTable,
      rng: mulberry32(8),
    });
    expect(b).toEqual(a);
  });

  it('rethrows solver errors that are not timeouts', async () => {
    await expect(
      newBoard(settings('any'), {
        solve: () => {
          throw new Error('worker crashed');
        },
        ddTable: noTable,
        rng: mulberry32(9),
      }),
    ).rejects.toThrow('worker crashed');
  });

  it('can be cancelled before it starts and while the solver runs', async () => {
    const before = new AbortController();
    before.abort();
    const solver = fakeSolve(() => 13);
    await expect(
      newBoard(settings('any', 'cushion'), {
        solve: solver.fn,
        ddTable: noTable,
        signal: before.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(solver.calls).toHaveLength(0);

    // Aborted right after the call, before the first board reaches the solver.
    const soon = new AbortController();
    const late = fakeSolve(() => 13);
    const p = newBoard(settings('any', 'cushion'), {
      solve: late.fn,
      ddTable: noTable,
      rng: mulberry32(10),
      signal: soon.signal,
    });
    soon.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
    expect(late.calls).toHaveLength(0);

    const during = new AbortController();
    await expect(
      newBoard(settings('any', 'cushion'), {
        solve: () => {
          during.abort(); // the solver ignores it and answers
          return 13;
        },
        ddTable: noTable,
        rng: mulberry32(10),
        signal: during.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('newBoard with DDS', () => {
  let dds: DdsSolver;
  beforeAll(async () => {
    dds = await loadDds();
  });
  const solve: SolveFn = (deal, trump) => {
    dds.clear();
    return dds.solve({ hands: deal, trump, trick: [], toPlay: 'W' });
  };

  const cases = CONTRACT_TYPES.flatMap((type) =>
    (['exact', 'cushion'] as const).flatMap((difficulty) =>
      [1, 2].map((seed) => ({ type, difficulty, seed })),
    ),
  );

  it.each(cases)(
    '$type / $difficulty (seed $seed): South declares the bid contract and DD makes it',
    async ({ type, difficulty, seed }) => {
      const board = await newBoard(settings(type, difficulty), {
        solve,
        ddTable: noTable,
        rng: mulberry32(3000 + seed),
      });
      expect(board).toMatchObject({ relaxed: false, withoutAuction: false, contractType: type });
      expect(validateDeal(board.deal, { full: true })).toBeNull();
      expectHonestAuction(board);
      expect(matchesType(board.contract, type)).toBe(true);
      expect(board.ddTricks).toBe(solve(board.deal, board.contract.strain, { timeoutMs: 0 }));
      expect(makesAtDifficulty(board.contract, board.ddTricks, difficulty)).toBe(true);
    },
    30_000,
  );

  it('deals boards where NS hold fewer HCP than EW (brief §4.1)', async () => {
    let weaker = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const board = await newBoard(settings('any'), {
        solve,
        ddTable: noTable,
        rng: mulberry32(seed),
      });
      if (nsHcp(board.deal) < 20) weaker++;
    }
    expect(weaker).toBeGreaterThan(0);
  }, 60_000);
});
