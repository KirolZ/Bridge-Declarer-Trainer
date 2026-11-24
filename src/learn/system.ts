// The game's bidding system as a reference page of the guide (M34, `#/learn/system`). Each row is
// an example auction; the page writes what its last call shows from the game's own system
// (src/bidding — `explainAuction`), so the numbers here are never typed by hand and cannot drift
// from what the bidder does. Only the short notes are written here.

import type { Auction, Call } from '../engine';
import { callerAt, sideOf } from '../engine';
import type { Language } from '../game/settings';
import { localize, perLanguage } from './localize';
import type { AuctionExample, Bilingual, Text } from './types';

export type SystemRow<T extends Text = string> = {
  /** The auction; the row explains its last call. Nobody vulnerable. */
  readonly auction: AuctionExample;
  /** What the meaning alone does not say (how the system chooses), in guide markup. */
  readonly note?: T;
};

export type SystemSection<T extends Text = string> = {
  readonly id: string;
  readonly title: T;
  readonly intro?: T;
  readonly rows: readonly SystemRow<T>[];
};

export type SystemPage<T extends Text = string> = {
  readonly title: T;
  readonly intro: readonly T[];
  readonly sections: readonly SystemSection<T>[];
  readonly notUsedTitle: T;
  readonly notUsed: readonly T[];
};

/**
 * English words of the Thai page that are not glossary terms (the test checks the rest): the
 * booklet's publisher, the Law of Total Tricks, everyday bidding words, and the names of the
 * conventions the system does not play (the game never shows them).
 */
export const SYSTEM_PAGE_WORDS: readonly string[] = [
  'ACBL',
  'Law',
  'of',
  'Total',
  'Tricks',
  'fit',
  'major',
  'minor',
  'inverted',
  'minors',
  'sacrifice',
  'penalty',
  'redouble',
  'negative',
  'cue',
  'bid',
  'convention',
  'Michaels',
  'Unusual',
  'Jacoby',
  'splinter',
  'quantitative',
  'positive',
  'response',
  'balancing',
  'Slam',
];

const N = (calls: string, note?: Bilingual): SystemRow<Bilingual> => ({
  auction: { dealer: 'N', calls },
  ...(note && { note }),
});

const SOURCE: SystemPage<Bilingual> = {
  title: { th: 'ระบบประมูลของเกม', en: "The game's bidding system" },
  intro: [
    {
      th: 'เกมนี้ประมูลทั้ง 4 ที่นั่งด้วยระบบ [[sayc|SAYC]] ตามเอกสารของ ACBL (บางจุดใช้ช่วงต่างจากเอกสารเล็กน้อย) หน้านี้รวมทุก [[call]] ที่ระบบใช้ ความหมายในแต่ละแถว**สร้างจากระบบของเกมโดยตรง** เป็นข้อมูลชุดเดียวกับที่ระบบใช้ตัดสินใจ และชุดเดียวกับที่แสดงเมื่อแตะ call บนโต๊ะ',
      en: "The game bids all 4 seats with the [[sayc|SAYC]] system from the ACBL booklet (a few ranges differ slightly). This page lists every [[call]] the system makes. Each meaning is **written by the game's own system**: the same data it bids with, and the same you see when you tap a call at the table.",
    },
    {
      th: 'วิธีอ่าน: แต่ละแถวคือการประมูลตัวอย่าง และความหมายเป็นของ call **สุดท้าย** · call ของฝั่งตรงข้ามอยู่ใน (วงเล็บ) และไม่เขียน Pass ของฝั่งตรงข้ามถ้าเขาไม่ได้ประมูลอะไรเลย · [[hcp|HCP]] = A 4, K 3, Q 2, J 1 · มือ [[balanced]] = ทุกดอกมีอย่างน้อย 2 ใบ (4-3-3-3, 4-4-3-2, 5-3-3-2)',
      en: "How to read it: each row is an example auction, and the meaning is that of its **last** call · the other side's calls are in (brackets), and their passes are left out when they never bid · [[hcp|HCP]] = A 4, K 3, Q 2, J 1 · a [[balanced]] hand has at least 2 cards in every suit (4-3-3-3, 4-4-3-2, 5-3-3-2).",
    },
  ],
  sections: [
    {
      id: 'openings',
      title: { th: 'การเปิดประมูล', en: 'Opening bids' },
      intro: {
        th: 'คนแรกที่ประมูลคือคนที่[[opening|เปิด]] ระบบเลือกการเปิดตามลำดับข้างล่าง มือที่ไม่เข้าแบบไหนเลย Pass',
        en: 'The first player to bid [[opening|opens]]. The system picks the opening in the order below; a hand that fits none of them passes.',
      },
      rows: [
        N('2C'),
        N('2N'),
        N('1N', {
          th: 'มี major 5 ใบ (ไม่ว่าจะ balanced ไหม) เปิด 1{H} / 1{S} แทน',
          en: 'With a five-card major (balanced or not), open 1{H} / 1{S} instead.',
        }),
        N('1S', {
          th: 'major 5 ใบขึ้นไปเปิด major',
          en: 'Five or more cards in a major: open the major.',
        }),
        N('1H'),
        N('1D', {
          th: 'ไม่มี major 5 ใบ: เปิด minor ที่ยาวกว่า · {D} กับ {C} ยาว 4-4 เปิด 1{D}',
          en: 'No five-card major: open the longer minor · with 4-4 in {D} and {C}, open 1{D}.',
        }),
        N('1C', {
          th: '{D} กับ {C} ยาว 3-3 เปิด 1{C}',
          en: 'With 3-3 in {D} and {C}, open 1{C}.',
        }),
        N('2H', {
          th: '2{D} และ 2{S} แบบเดียวกัน (2{C} ไม่ใช่ weak two)',
          en: '2{D} and 2{S} are the same (2{C} is not a weak two).',
        }),
        N('3C', {
          th: 'เปิด 3 ในดอกอื่นก็แบบเดียวกัน',
          en: 'An opening of 3 in any other suit is the same.',
        }),
        N('P'),
      ],
    },
    {
      id: 'responses-major',
      title: { th: 'ตอบการเปิด 1{H} / 1{S}', en: 'Responding to 1{H} / 1{S}' },
      rows: [
        N('1S-P-4S'),
        N('1S-P-3S'),
        N('1S-P-2S'),
        N('1H-P-1S', {
          th: 'ไม่มี fit ใน {H} แต่มี {S} 4 ใบ',
          en: 'No {H} fit, but four {S}.',
        }),
        N('1S-P-2H'),
        N('1S-P-2D', {
          th: 'ดอกใหม่ระดับ 2 ([[two-over-one|2/1]]) · มือถึง game ที่มี fit แต่ไม่มีดอกอื่นจะประมูล ใช้ minor 3 ใบ แล้วค่อยบอก fit ทีหลัง',
          en: 'A new suit at the 2 level ([[two-over-one|2/1]]) · a game hand with a fit and nothing else to bid uses a three-card minor and shows the fit later.',
        }),
        N('1S-P-2N'),
        N('1S-P-3N'),
        N('1S-P-1N', {
          th: 'ไม่ได้บังคับ (SAYC ใช้ 1NT แบบไม่บังคับ)',
          en: 'Not forcing (SAYC plays a non-forcing 1NT).',
        }),
        N('1S-P-P'),
      ],
    },
    {
      id: 'responses-minor',
      title: { th: 'ตอบการเปิด 1{C} / 1{D}', en: 'Responding to 1{C} / 1{D}' },
      intro: {
        th: 'major 4 ใบประมูลก่อน raise minor เสมอ',
        en: 'A four-card major comes before raising the minor.',
      },
      rows: [
        N('1D-P-1H'),
        N('1D-P-1S'),
        N('1D-P-2D'),
        N('1D-P-3D'),
        N('1C-P-2C', {
          th: 'raise {C} ต้องมี 5 ใบ ({D} 4 ใบพอ) — ไม่ใช้ inverted minors',
          en: 'A {C} raise needs five cards ({D}: four) — no inverted minors.',
        }),
        N('1D-P-2C'),
        N('1D-P-1N'),
        N('1D-P-2N'),
        N('1D-P-3N'),
        N('1D-P-P'),
      ],
    },
    {
      id: 'rebids',
      title: { th: 'ผู้เปิดประมูลรอบสอง', en: "Opener's rebid" },
      intro: {
        th: 'หลัง 1{D} – 1{S}:',
        en: 'After 1{D} – 1{S}:',
      },
      rows: [
        N('1D-P-1S-P-2S'),
        N('1D-P-1S-P-3S'),
        N('1D-P-1S-P-4S'),
        N('1D-P-1S-P-1N'),
        N('1D-P-1S-P-2N'),
        N('1D-P-1S-P-2C'),
        N('1D-P-1S-P-2D'),
        N('1D-P-1S-P-2H', {
          th: '[[reverse]]: ดอกที่สองสูงกว่าดอกแรก คู่ต้องขึ้นระดับ 3 ถ้าจะกลับดอกแรก จึงต้องมือแรง',
          en: 'A [[reverse]]: the second suit ranks above the first, so partner must go to the 3 level to return to it — a strong hand.',
        }),
        N('1D-P-1S-P-3C'),
      ],
    },
    {
      id: 'rebids-balanced',
      title: { th: 'ผู้เปิด 1{H} / 1{S} มือ balanced', en: 'A balanced 1{H} / 1{S} opener' },
      intro: {
        th: 'ผู้เปิด major ที่ balanced (5-3-3-2) มีได้ 12–19 HCP ระบบจึงกำหนดช่วงให้ชัดตามการตอบ',
        en: 'A balanced major opener (5-3-3-2) can hold 12–19 HCP, so the system sets the ranges by the response.',
      },
      rows: [
        N('1H-P-1S-P-1N'),
        N('1H-P-1S-P-2N'),
        N('1H-P-1S-P-3N'),
        N('1H-P-1N-P-P'),
        N('1H-P-1N-P-2N'),
        N('1H-P-1N-P-3N'),
        N('1H-P-2C-P-2N'),
        N('1H-P-2C-P-3N'),
      ],
    },
    {
      id: 'rebids-two-over-one',
      title: { th: 'ผู้เปิดหลัง 2/1', en: 'Opener after a 2/1' },
      intro: {
        th: 'ดอกใหม่ของผู้เปิดหลัง [[two-over-one|2/1]] บังคับคู่ประมูลต่อหนึ่งรอบ ส่วน rebid ดอกเดิม / 2NT / raise คู่ Pass ได้ (2/1 ใน SAYC ไม่บังคับถึง game)',
        en: "Opener's new suit after a [[two-over-one|2/1]] forces responder to bid once more; after a rebid of the suit, 2NT or a raise, responder may pass (a 2/1 is not game forcing in SAYC).",
      },
      rows: [N('1H-P-2C-P-2D'), N('1H-P-2C-P-2H')],
    },
    {
      id: 'notrump',
      title: { th: 'หลังเปิด 1NT / 2NT', en: 'After a 1NT / 2NT opening' },
      rows: [
        N('1N-P-2C'),
        N('1N-P-2C-P-2D'),
        N('1N-P-2C-P-2H'),
        N('1N-P-2C-P-2S'),
        N('1N-P-2D'),
        N('1N-P-2D-P-2H'),
        N('1N-P-2H'),
        N('1N-P-2N'),
        N('1N-P-3N'),
        N('1N-P-6N'),
        N('1N-P-P'),
        N('2N-P-3C', {
          th: 'หลัง 2NT ใช้ Stayman และ transfer ที่ระดับ 3 แบบเดียวกัน',
          en: 'After 2NT, Stayman and transfers work the same one level higher.',
        }),
        N('2N-P-3D'),
        N('2N-P-3N'),
      ],
    },
    {
      id: 'two-clubs',
      title: { th: 'หลังเปิด 2{C}', en: 'After a 2{C} opening' },
      rows: [N('2C-P-2D'), N('2C-P-2D-P-2N'), N('2C-P-2D-P-3N'), N('2C-P-2D-P-2H')],
    },
    {
      id: 'slam',
      title: { th: 'Slam', en: 'Slams' },
      intro: {
        th: 'ฝั่งที่มีแต้มรวมกัน 33 ขึ้นไปไป [[slam]]: มี fit ถาม A ด้วย [[blackwood|Blackwood]] ก่อน ไม่มี fit ประมูล 6NT',
        en: 'A side with 33 or more points between them goes to a [[slam]]: with a fit it first asks for aces with [[blackwood|Blackwood]]; without one it bids 6NT.',
      },
      rows: [
        N('1S-P-3S-P-4N'),
        N('1S-P-3S-P-4N-P-5C'),
        N('1S-P-3S-P-4N-P-5D'),
        N('1S-P-3S-P-4N-P-5H'),
        N('1S-P-3S-P-4N-P-5S'),
      ],
    },
    {
      id: 'placing',
      title: { th: 'ตัดสิน contract', en: 'Placing the contract' },
      intro: {
        th: 'เมื่อรู้แต้มของคู่แล้ว: fit 8 ใบใน major → 4 ใน major, ไม่มี fit major แต่แต้มถึง → 3NT, fit ใน minor และแต้มรวม 29 ขึ้นไป → 5 ใน minor · ถ้าแต้มคู่ยังกว้าง (ช่วงกว้างไม่เกิน 5) ชวนไป game ก่อน · ไม่ถึง game หยุดใน [[partscore]] ที่มี fit หรือ NT',
        en: "Once partner's points are known: an 8-card major fit → 4 of the major; no major fit but the points → 3NT; a minor fit with 29 or more together → 5 of the minor · if partner's range is still wide (5 points or less apart), invite first · short of game, stop in a [[partscore]] with a fit, or in NT.",
      },
      rows: [N('1S-P-2S-P-3S'), N('1S-P-3S-P-4S')],
    },
    {
      id: 'overcalls',
      title: { th: 'เมื่อฝั่งตรงข้ามเปิดก่อน', en: 'When the other side opens' },
      rows: [
        N('1H-1S'),
        N('1H-2C'),
        N('1H-2S', {
          th: 'กระโดดหนึ่งระดับ = มือเบาที่มีดอกยาว 6 ใบ',
          en: 'A jump of one level: a weak hand with a six-card suit.',
        }),
        N('1H-1N'),
        N('1H-X', {
          th: 'X ทุกตัวในระบบนี้เป็น [[takeout-double|takeout double]] · 17 ขึ้นไป double ได้แม้ไม่สั้นในดอกของเขามาก',
          en: 'Every X in this system is a [[takeout-double|takeout double]] · with 17 or more you may double without being short in their suit.',
        }),
        N('2H-2N'),
        N('2H-2S'),
        N('1N-2S', {
          th: 'หลัง 1NT ของเขา overcall ด้วยดอก 6 ใบเท่านั้น',
          en: 'Over their 1NT, overcall only with a six-card suit.',
        }),
      ],
    },
    {
      id: 'balancing',
      title: { th: 'ที่นั่งสุดท้าย (balancing)', en: 'In the last seat (balancing)' },
      intro: {
        th: 'ถ้า Pass แล้วการประมูลจบ ระบบประมูลด้วยมือที่เบากว่าปกติ',
        en: 'When a pass would end the auction, the system bids on lighter hands.',
      },
      rows: [N('1H-P-P-X'), N('1H-P-P-1S'), N('1H-P-P-1N')],
    },
    {
      id: 'advances',
      title: { th: 'คู่ของคนที่ double / overcall', en: 'Partner of the doubler / overcaller' },
      intro: {
        th: 'หลัง takeout double คู่ต้องประมูลถ้าคนถัดไป Pass (ไม่มี Pass เพื่อเก็บแต้มปรับ):',
        en: 'After a takeout double, partner must bid if the next player passes (no pass for penalties):',
      },
      rows: [
        N('1H-X-P-4S'),
        N('1H-X-P-3N'),
        N('1H-X-P-2S'),
        N('1H-X-P-2N'),
        N('1H-X-P-1S'),
        N('1H-X-P-1N'),
        N('1H-X-P-2C', {
          th: 'ดอกถูกที่สุดที่มี 3 ใบ เมื่อไม่มีทางอื่น',
          en: 'The cheapest three-card suit, when nothing else fits.',
        }),
        N('1H-1S-P-4S'),
        N('1H-1S-P-2S', {
          th: 'raise ตาม Law of Total Tricks: [[trump]] รวม 8 ใบ → ระดับ 2, 9 ใบ → ระดับ 3',
          en: 'Raises follow the Law of Total Tricks: 8 [[trump|trumps]] together → the 2 level, 9 → the 3 level.',
        }),
        N('1H-1S-P-3S'),
        N('1H-1S-P-1N'),
        N('1H-1S-P-2D'),
      ],
    },
    {
      id: 'interference',
      title: { th: 'ฝั่งที่เปิดเมื่อโดนแทรก', en: 'When the opening side is overcalled' },
      intro: {
        th: 'หลัง 1{H} – (1{S}):',
        en: 'After 1{H} – (1{S}):',
      },
      rows: [
        N('1H-1S-4H'),
        N('1H-1S-3H'),
        N('1H-1S-2H'),
        N('1H-1S-2C'),
        N('1H-1S-1N'),
        N('1H-1S-2N'),
        N('1H-1S-3N'),
        N('1H-X-1S', {
          th: 'หลัง takeout double ของเขา ตอบเหมือนไม่มีใครแทรก',
          en: 'After their takeout double, respond as if nobody had bid.',
        }),
        N('1H-X-2H'),
      ],
    },
    {
      id: 'competing',
      title: { th: 'แย่ง partscore', en: 'Competing for the partscore' },
      intro: {
        th: 'ถ้า bid ล่าสุดเป็นของฝั่งตรงข้าม: ไป game ถ้าแต้มถึง, แย่งใน fit ตาม Law of Total Tricks (ไม่เกินระดับ 3) หรือ Pass ให้เขาเล่น — ระบบไม่ double เพื่อเก็บแต้มปรับ จึง**ไม่มีการประมูลไหนจบโดยถูก double**',
        en: 'When the last bid is theirs: bid game with the points, compete in a fit by the Law of Total Tricks (no higher than the 3 level), or pass and let them play — the system never doubles for penalties, so **no auction ends doubled**.',
      },
      rows: [N('1H-1S-2H-2S'), N('1H-1S-2H-P-P-2S')],
    },
  ],
  notUsedTitle: { th: 'สิ่งที่ระบบไม่ใช้', en: 'What the system does not play' },
  notUsed: [
    {
      th: 'การประมูลเพื่อเสียน้อยกว่า (sacrifice), double เพื่อเก็บแต้มปรับ (penalty), redouble, negative double, cue bid',
      en: 'Sacrifices, penalty doubles, redoubles, negative doubles, cue bids.',
    },
    {
      th: 'convention ขั้นสูง: Michaels, Unusual 2NT, Jacoby 2NT, splinter, 4NT แบบ quantitative, positive response ของ 2{C}',
      en: 'Advanced conventions: Michaels, the Unusual 2NT, Jacoby 2NT, splinters, a quantitative 4NT, positive responses to 2{C}.',
    },
    {
      th: 'แต้มจากการกระจายไพ่ (นับแค่ HCP) และ [[vulnerable|vul]] ยังไม่มีผลกับการประมูล',
      en: 'Points for shape (only HCP count), and [[vulnerable|vulnerability]] does not change the bidding yet.',
    },
  ],
};

/** The page in one language. */
export const systemPageIn = perLanguage((lang: Language) => localize(SOURCE, lang) as SystemPage);

export const SYSTEM_PAGE_SOURCE = SOURCE;

function callText(call: Call): string {
  switch (call.kind) {
    case 'bid':
      return call.strain === 'NT' ? `${call.level}NT` : `${call.level}{${call.strain}}`;
    case 'pass':
      return 'Pass';
    case 'double':
      return 'X';
    case 'redouble':
      return 'XX';
  }
}

/**
 * An auction as bridge books write it, in guide markup: the side that made the last call plain,
 * the other side in brackets — `(1{H}) – 1{S}` — and the other side's passes left out when that
 * side never bid (`1{S} – 2{S}`, not `1{S} – (Pass) – 2{S}`). Passes before the opening are left out.
 */
export function auctionSequence(auction: Auction): string {
  const { dealer, calls } = auction;
  const us = sideOf(callerAt(dealer, calls.length - 1));
  const theirs = calls.filter((_, i) => sideOf(callerAt(dealer, i)) !== us);
  const theyBid = theirs.some((c) => c.kind !== 'pass');
  // Passes before the first bid are left out: the examples are about what follows the opening.
  const first = calls.findIndex((c) => c.kind !== 'pass');
  const out: string[] = [];
  calls.forEach((c, i) => {
    if (i < first) return;
    if (sideOf(callerAt(dealer, i)) === us) out.push(callText(c));
    else if (theyBid) out.push(`(${callText(c)})`);
  });
  return out.join(' – ');
}
