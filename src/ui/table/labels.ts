// Seat and vulnerability names shown on the table.

import type { Card, IllegalReason, Seat, Vulnerability } from '../../engine';
import { SUIT_INFO, rankLabel } from '../../engine';

export const SEAT_NAME: Readonly<Record<Seat, string>> = {
  N: 'North',
  E: 'East',
  S: 'South',
  W: 'West',
};

/** Seat name with its role, e.g. "North (dummy)". */
export const SEAT_ROLE: Readonly<Record<Seat, string>> = {
  N: 'North (dummy)',
  E: 'East',
  S: 'South (คุณ)',
  W: 'West',
};

export const VULNERABILITY_LABEL: Readonly<Record<Vulnerability, string>> = {
  none: 'ไม่มีฝ่ายไหน vul',
  ns: 'NS vul',
};

/** Spoken name of a card, e.g. "A โพดำ", "10 โพแดง". */
export function cardName(card: Card): string {
  return `${rankLabel(card.rank)} ${SUIT_INFO[card.suit].thaiName}`;
}

/**
 * Why a card cannot be played, e.g. "ต้องลง ♥ เพราะยังมี ♥ อยู่". With the seat of the card's
 * hand (the table, SPEC §7.8): "ต้องลง ♥ เพราะคุณยังมี ♥ อยู่", or for dummy "…เพราะ dummy ยังมี…".
 */
export function illegalText(reason: IllegalReason, owner?: Seat): string {
  switch (reason.code) {
    case 'must-follow-suit': {
      const s = SUIT_INFO[reason.suit].symbol;
      const who = owner === 'S' ? 'คุณ' : owner === 'N' ? ' dummy ' : '';
      return `ต้องลง ${s} เพราะ${who}ยังมี ${s} อยู่`;
    }
    case 'not-in-hand':
      if (reason.seat === 'N') return 'ตอนนี้ถึงตา dummy — กดไพ่ของ North ด้านบน';
      if (reason.seat === 'S') return 'ตอนนี้ถึงตาคุณ — กดไพ่จากมือ South ด้านล่าง';
      return `ไม่ใช่ไพ่ของ ${SEAT_NAME[reason.seat]}`;
    case 'hand-complete':
      return 'เล่นครบทุก trick แล้ว';
  }
}
