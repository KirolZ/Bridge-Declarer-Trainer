import { describe, expect, it } from 'vitest';
import type { Auction } from '../engine';
import { dealRandom, decodeAuction, encodeDeal, mulberry32 } from '../engine';
import { handFromLink, handPath } from './handLink';
import type { HandSetup } from './playStore';

const deal = dealRandom(mulberry32(27));
const code = encodeDeal(deal);
const q = (query: string) => new URLSearchParams(query);
/** East deals, South opens 1♥ and plays 4♥. */
const AUCTION = decodeAuction('E', 'P-1H-P-2H-P-4H-P-P-P') as Auction;

describe('hand links', () => {
  it('opens links without an auction as before (SPEC §4.4)', () => {
    expect(handFromLink(code, '4S', q(''))).toEqual({
      deal: expect.anything(),
      contract: { level: 4, strain: 'S', declarer: 'S' },
      vulnerability: 'none',
    });
    expect(handFromLink(code, '3N', q('v=ns'))!.vulnerability).toBe('ns');
    expect(handFromLink(code, '3N', q('d=E'))!.auction).toBeUndefined(); // d alone is ignored
    expect(handFromLink(code, '9S', q(''))).toBeNull();
    expect(handFromLink(code.slice(1), '4S', q(''))).toBeNull();
  });

  it('round-trips a hand with an auction and vulnerability', () => {
    const hand: HandSetup = {
      deal,
      contract: { level: 4, strain: 'H', declarer: 'S' },
      vulnerability: 'ns',
      auction: AUCTION,
    };
    const path = handPath(hand);
    expect(path).toBe(`/play/${code}/4H?v=ns&d=E&a=P-1H-P-2H-P-4H-P-P-P`);
    const [, c, contract, query] = /^\/play\/([^/]+)\/([^?]+)\?(.*)$/.exec(path)!;
    expect(c).toBe(code);
    const back = handFromLink(c!, contract!, q(query!));
    expect(back!.auction).toEqual(AUCTION);
    expect(back!.vulnerability).toBe('ns');
    expect(handPath(back!)).toBe(path);
  });

  it('refuses an auction that does not fit the contract or the game', () => {
    const open = (contract: string, query: string) => handFromLink(code, contract, q(query));
    expect(open('4H', 'd=E&a=P-1H-P-2H-P-4H-P-P-P')).not.toBeNull();
    expect(open('4S', 'd=E&a=P-1H-P-2H-P-4H-P-P-P')).toBeNull(); // another contract
    expect(open('4H', 'a=P-1H-P-2H-P-4H-P-P-P')).toBeNull(); // no dealer
    expect(open('4H', 'd=E&a=P-1H-P-2H-P-4H-P-P')).toBeNull(); // not finished
    expect(open('4H', 'd=E&a=P-1H-P-2H-P-4H-X-P-P-P')).toBeNull(); // doubled
    expect(open('4H', 'd=N&a=P-1H-P-2H-P-4H-P-P-P')).toBeNull(); // East declares
    expect(open('4H', 'd=W&a=P-1H-P-2H-P-4H-P-P-P')).toBeNull(); // North declares
    expect(open('1S', 'd=E&a=P-P-P-P')).toBeNull(); // passed out
    expect(open('4H', 'd=E&a=P-1H-P-1D-P-4H-P-P-P')).toBeNull(); // illegal
    expect(open('4H', 'd=E&a=')).toBeNull();
  });
});
