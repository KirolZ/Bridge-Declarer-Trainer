// Public API of the bidding system (pure TS, no DOM — SPEC §3, §6.5).

export type { BidStep, BidResult } from './bidder';
export { bidDeal, chooseCall, explainAuction, explainCall } from './bidder';
export type { BidContext } from './context';
export { buildContext } from './context';
export type { HandEval } from './evaluate';
export { evaluate } from './evaluate';
export type { Forcing, Meaning, MeaningName, Range, Shown } from './meaning';
export { MAX_HCP, NOTHING_SHOWN, NO_INFO, fits, hull, narrow } from './meaning';
