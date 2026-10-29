// Chapter 3 (SPEC §7.7): trumps and no trumps.

import type { Bilingual, Chapter } from '../types';

export const CH3: Chapter<Bilingual> = {
  n: 3,
  title: { th: 'Trump และ No Trump', en: 'Trumps and no trumps' },
  topic: {
    th: 'ดอกที่ชนะทุกดอก, ใช้ได้เมื่อไหร่, NT',
    en: 'The suit that beats all the others, when you may use it, NT',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'contract ส่วนใหญ่กำหนดให้ดอกหนึ่งเป็น [[trump]] (ไพ่ตัด — ดอกที่ชนะทุกดอกอื่น) ดอกไหนเป็น trump ดูได้จาก contract (บทที่ 4) เช่น contract 4{S} มี {S} เป็น trump',
        en: 'Most contracts make one suit [[trump|trumps]]: a suit that beats every other suit. The contract tells you which (chapter 4): in a 4{S} contract, {S} are trumps.',
      },
    },
    { kind: 'h', text: { th: 'ใช้ trump ได้เมื่อไหร่', en: 'When you may play a trump' } },
    {
      kind: 'p',
      text: {
        th: 'กติกา[[follow-suit|ลงตามดอก]]ยังเหมือนเดิม: ถ้ายังมีดอกที่นำ **ต้องลงดอกนั้น** จะลง trump แทนไม่ได้ เมื่อ**ไม่มีดอกที่นำเหลือแล้ว**เท่านั้น จึงลง trump ได้ เรียกว่า [[ruff|ตัด]] (ruff)',
        en: 'The rule of [[follow-suit|following suit]] still holds: if you have a card of the suit led, **you must play it**, not a trump. Only when you **have none of the suit led** may you play a trump. This is a [[ruff]].',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'trump ใบเดียวชนะทุกใบของดอกอื่น แม้จะเป็น trump ใบเล็กที่สุดเจอกับ A ของดอกอื่นก็ตาม',
        en: 'A single trump beats every card of the other suits — even the smallest trump beats an ace of another suit.',
      },
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'HK H2 S2 HA',
      trump: 'S',
      caption: {
        th: 'trump คือ {S} · West นำ {HK} · East ไม่มี {H} จึงตัดด้วย {S2} — {HA} ใหญ่ที่สุดใน {H} ก็จริง แต่ trump ชนะ East จึงกิน',
        en: 'Trumps are {S} · West leads {HK} · East has no {H} and ruffs with {S2} — {HA} is the highest {H}, but the trump wins, so East takes the trick',
      },
    },
    { kind: 'h', text: { th: 'ตัดซ้อน', en: 'Overruffing' } },
    {
      kind: 'p',
      text: {
        th: 'ถ้ามีมากกว่าหนึ่งคนตัด **trump ใบที่ใหญ่ที่สุดกิน** การตัดด้วย trump ที่ใหญ่กว่าคนก่อนเรียกว่า[[overruff|ตัดซ้อน]] (overruff)',
        en: 'If more than one player ruffs, **the highest trump wins**. Ruffing with a higher trump than an earlier one is an [[overruff]].',
      },
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'DK S3 S8 D2',
      trump: 'S',
      caption: {
        th: 'trump คือ {S} · West นำ {DK} · North ตัดด้วย {S3} · East ก็ไม่มี {D} เลยตัดซ้อนด้วย {S8} ซึ่งใหญ่กว่า East จึงกิน',
        en: 'Trumps are {S} · West leads {DK} · North ruffs with {S3} · East has no {D} either and overruffs with {S8}, which is higher, so East wins',
      },
    },
    { kind: 'h', text: { th: 'ไม่บังคับให้ตัด', en: 'You do not have to ruff' } },
    {
      kind: 'p',
      text: {
        th: 'เมื่อไม่มีดอกที่นำ จะตัดด้วย trump หรือ[[discard|ทิ้ง]]ดอกอื่นก็ได้ กติกา**ไม่บังคับ**ให้ตัด เลือกตามแผนของคุณ',
        en: 'With no card of the suit led, you may ruff or [[discard]] another suit. The rules **do not force** you to ruff — choose whatever suits your plan.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ถ้ามีคนนำ trump มาเอง ทุกคนต้องลง trump ตาม (ถ้ามี) แล้ว trump ใบใหญ่ที่สุดกิน เหมือนดอกทั่วไป',
        en: 'If someone leads a trump, everyone must follow with a trump (if they have one), and the highest trump wins, just like any other suit.',
      },
    },
    { kind: 'h', text: { th: 'No Trump', en: 'No trumps' } },
    {
      kind: 'p',
      text: {
        th: 'contract บางแบบไม่มี trump เลย เรียกว่า [[nt|NT]] (No Trump) ใน NT ใบที่ใหญ่ที่สุด**ของดอกที่นำ**กินเสมอ คนที่ไม่มีดอกที่นำทำได้แค่ทิ้ง ไม่มีทางกิน',
        en: 'Some contracts have no trumps at all: [[nt|NT]] (no trumps). In NT the highest card **of the suit led** always wins. A player without the suit led can only discard, never win.',
      },
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'HK H2 S2 HA',
      trump: 'NT',
      caption: {
        th: 'ไพ่ชุดเดียวกับตัวอย่างแรก แต่เล่น NT: {S2} ของ East เป็นแค่ใบที่ทิ้ง {HA} ของ South จึงกิน',
        en: "The same cards as the first example, played in NT: East's {S2} is just a discard, so South wins with {HA}",
      },
    },
    {
      kind: 'note',
      text: {
        th: 'บนโต๊ะเกมนี้ contract จะแสดงอยู่มุมบน เช่น 4{S} (มี {S} เป็น trump) หรือ 3NT (ไม่มี trump)',
        en: "On this game's table the contract is shown at the top, e.g. 4{S} ({S} are trumps) or 3NT (no trumps).",
      },
    },
  ],
};
