// Dealing a board with its auction (SPEC §7.1.1). The bidder bids a random deal from a random
// dealer; the board is kept only when South declares (North's boards are turned round) and the
// solver confirms that the contract makes at the chosen difficulty, so following the hints always
// makes it. With the auction setting off, or when no bid board matches in time, the contract is
// chosen from the double-dummy table as before (SPEC §7.1.2, `newHand`).

import type { Auction, Contract, Deal, Rng, Seat, Strain, Vulnerability } from '../engine';
import {
  SEATS,
  auctionResult,
  cryptoRng,
  dealRandom,
  isPassedOut,
  rotateAuction,
  rotateDeal,
} from '../engine';
import { bidDeal } from '../bidding';
import { MIN_NS_HCP, matchesType, nsHcp, relaxContractType } from './contract';
import type { NewHand, NewHandOptions } from './newHand';
import { DD_TABLE_TIMEOUT_MS, MAX_SOLVED_DEALS, newHand } from './newHand';
import type { ContractType, DealSettings, Difficulty } from './settings';

/** Deals bid while looking for one board to send to the solver (slam boards are the rarest). */
export const MAX_BID_DEALS = 100_000;

/** Longest stretch of bidding before giving the page a turn (the loop runs on the main thread). */
export const BID_SLICE_MS = 8;

/** NS tricks in `strain` with West on lead. */
export type SolveFn = (
  deal: Deal,
  strain: Strain,
  options: { signal?: AbortSignal; timeoutMs: number },
) => Promise<number> | number;

/** Why a bid deal was not kept (counted by the bench). */
export type RejectReason =
  | 'fallback' // a call no rule of the system fitted: its meaning could mislead
  | 'passedOut'
  | 'doubled'
  | 'defenders' // East or West declares
  | 'type' // the contract is not of the wanted type
  | 'dd' // the solver says it does not make at the difficulty
  | 'timeout';

export type NewBoardOptions = NewHandOptions & {
  solve: SolveFn;
  /** Called for every deal that was bid and not kept. */
  onReject?: (reason: RejectReason) => void;
};

export type Board = {
  readonly deal: Deal;
  readonly contract: Contract;
  /** How the board was bid, South declaring `contract`; null when dealt without an auction. */
  readonly auction: Auction | null;
  /** NS double-dummy tricks in the contract's strain, West on lead. */
  readonly ddTricks: number;
  /** The contract type the board was chosen for: the setting, or a looser one if relaxed. */
  readonly contractType: ContractType;
  /** True when no board matched the setting in time and a looser type was used. */
  readonly relaxed: boolean;
  /** An auction was wanted but no bid board matched, so the board was dealt without one. */
  readonly withoutAuction: boolean;
  /** How many deals went to the solver. */
  readonly solvedDeals: number;
  /** How many deals the bidder bid. */
  readonly biddenDeals: number;
};

export type BidBoard = {
  readonly deal: Deal;
  readonly auction: Auction;
  readonly contract: Contract;
};

/**
 * `deal` bid from `dealer`, turned round when North declares; or why it cannot be a board. The
 * vulnerability stays: turning the table round keeps each pair on its side.
 */
export function bidBoard(
  deal: Deal,
  dealer: Seat,
  vulnerability: Vulnerability,
): BidBoard | RejectReason {
  const { auction, steps } = bidDeal(deal, dealer, vulnerability);
  if (steps.some((s) => s.rule === 'fallback')) return 'fallback';
  const result = isPassedOut(auction.calls) ? null : auctionResult(auction);
  if (!result) return 'passedOut';
  if (result.doubling !== 0) return 'doubled';
  if (result.declarer === 'E' || result.declarer === 'W') return 'defenders';
  const north = result.declarer === 'N';
  return {
    deal: north ? rotateDeal(deal) : deal,
    auction: north ? rotateAuction(auction) : auction,
    contract: { level: result.level, strain: result.strain, declarer: 'S' },
  };
}

/** The contract makes with exactly no trick to spare (`exact`) or at least one (`cushion`). */
export function makesAtDifficulty(contract: Contract, ddTricks: number, difficulty: Difficulty) {
  const need = contract.level + 6;
  return difficulty === 'exact' ? ddTricks === need : ddTricks >= need + 1;
}

function isTimeout(err: unknown): boolean {
  return err instanceof Error && /timeout/i.test(err.name);
}

const nextTurn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * Deals a board per `settings` (SPEC §7.1.1). Only boards South declares with a contract of the
 * wanted type go to the solver; after `MAX_SOLVED_DEALS` misses the type is relaxed (slam → game
 * → any) and `relaxed` is set; when even the loosest type misses, the board is dealt without an
 * auction (`withoutAuction`). A solve that times out counts as a miss. Aborting `signal` rejects
 * with its reason (an `AbortError`).
 */
export async function newBoard(settings: DealSettings, options: NewBoardOptions): Promise<Board> {
  const { signal } = options;
  const rng: Rng = options.rng ?? cryptoRng();
  if (!settings.showAuction)
    return unbid(await newHand(settings, { ...options, rng }), false, 0, 0);
  const timeoutMs = options.timeoutMs ?? DD_TABLE_TIMEOUT_MS;
  let type: ContractType | null = settings.contractType;
  let solvedDeals = 0;
  let biddenDeals = 0;
  let sliceStart = performance.now();

  /** The next bid board of `type`, or null after `MAX_BID_DEALS` deals without one. */
  async function candidate(want: ContractType): Promise<BidBoard | null> {
    for (let i = 0; i < MAX_BID_DEALS; i++) {
      if (performance.now() - sliceStart > BID_SLICE_MS) {
        await nextTurn();
        sliceStart = performance.now();
      }
      signal?.throwIfAborted();
      const deal = dealRandom(rng);
      const dealer = SEATS[Math.floor(rng() * 4)]!;
      // The bidder bids a slam only with 33+ HCP between the pair (SPEC §6.5), so slam deals below
      // the old filter are not worth bidding; no other type is filtered (games can be bid on less).
      if (want === 'slam' && nsHcp(deal) < MIN_NS_HCP.slam) continue;
      biddenDeals++;
      const board = bidBoard(deal, dealer, settings.vulnerability);
      if (typeof board === 'string') options.onReject?.(board);
      else if (!matchesType(board.contract, want)) options.onReject?.('type');
      else return board;
    }
    return null;
  }

  while (type) {
    for (let miss = 0; miss < MAX_SOLVED_DEALS; miss++) {
      const board = await candidate(type);
      if (!board) break;
      signal?.throwIfAborted(); // aborted while `candidate` was resolving
      solvedDeals++;
      let tricks: number;
      try {
        tricks = await options.solve(board.deal, board.contract.strain, { signal, timeoutMs });
      } catch (err) {
        signal?.throwIfAborted();
        if (!isTimeout(err)) throw err;
        options.onReject?.('timeout');
        continue;
      }
      signal?.throwIfAborted();
      sliceStart = performance.now();
      if (makesAtDifficulty(board.contract, tricks, settings.difficulty)) {
        return {
          ...board,
          ddTricks: tricks,
          contractType: type,
          relaxed: type !== settings.contractType,
          withoutAuction: false,
          solvedDeals,
          biddenDeals,
        };
      }
      options.onReject?.('dd');
    }
    type = relaxContractType(type);
  }
  return unbid(await newHand(settings, { ...options, rng }), true, solvedDeals, biddenDeals);
}

/** A board dealt the pre-M30 way (no auction), after `solvedDeals` and `biddenDeals` of its own. */
function unbid(hand: NewHand, withoutAuction: boolean, solvedDeals: number, biddenDeals: number) {
  return {
    deal: hand.deal,
    contract: hand.contract,
    auction: null,
    ddTricks: hand.ddTricks,
    contractType: hand.contractType,
    relaxed: hand.relaxed,
    withoutAuction,
    solvedDeals: solvedDeals + hand.solvedDeals,
    biddenDeals,
  } satisfies Board;
}
