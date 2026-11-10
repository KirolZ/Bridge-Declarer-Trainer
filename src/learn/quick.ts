// The quick guide (M25): one short page with just enough to play the first hand, for players who
// will not read six chapters first. The full guide (chapters 1–14) stays as it is; this page
// links to it. Same blocks and markup as a chapter, so the guide's content tests cover it too.

import { localize, perLanguage } from './localize';
import type { Bilingual, QuickGuide } from './types';

const SOURCE: QuickGuide<Bilingual> = {
  title: { th: 'คู่มือฉบับย่อ', en: 'Quick guide' },
  intro: {
    th: 'อ่าน 2 นาทีก็เล่นได้ ที่เหลือค่อยเรียนรู้ระหว่างเล่น',
    en: 'Two minutes and you can play. Learn the rest as you go.',
  },
  blocks: [
    {
      kind: 'h',
      text: {
        th: '1. คุณคือ South และคุมไพ่ North ด้วย',
        en: '1. You are South, and you play North too',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'Bridge เล่น 4 คน 2 ทีม ทุกคนถือไพ่ 13 ใบ North กับ South เป็นทีมคุณ ([[ns-ew|NS]]) ส่วน West กับ East เป็นบอท คุณลงไพ่ทั้งมือของคุณ (ด้านล่าง) และมือ North ที่หงายอยู่ด้านบน เรียกว่า [[dummy]]',
        en: 'Bridge is played by 4 players in 2 teams, 13 cards each. North and South are your team ([[ns-ew|NS]]); West and East are bots. You play your own hand (at the bottom) and North, the face-up hand at the top, called [[dummy]].',
      },
    },
    {
      kind: 'h',
      text: {
        th: '2. เป้าหมาย: ได้ trick ให้ครบตาม contract',
        en: '2. The goal: take the tricks your contract needs',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ทุกคนลงไพ่คนละ 1 ใบเป็น 1 [[trick]] (ตา) ทั้งมือมี 13 trick [[contract]] (สัญญา) ที่มุมจอบอกว่าต้องได้กี่ trick: **เอาตัวเลขบวก 6**',
        en: 'Each player plays one card: that is one [[trick]]. A hand has 13 tricks. The [[contract]] in the corner of the screen says how many you need: **add 6 to the number**.',
      },
    },
    {
      kind: 'list',
      items: [
        { th: '[[nt|3NT]] → 6 + 3 = **9** trick', en: '[[nt|3NT]] → 6 + 3 = **9** tricks' },
        { th: '4{S} → 6 + 4 = **10** trick', en: '4{S} → 6 + 4 = **10** tricks' },
      ],
    },
    {
      kind: 'h',
      text: { th: '3. ต้องลงดอกตาม ใบสูงสุดกิน', en: '3. Follow suit; the highest card wins' },
    },
    {
      kind: 'p',
      text: {
        th: 'คนแรกเป็นคน[[lead|นำ]] แล้วเวียนตามเข็มนาฬิกา ทุกคน**ต้องลงดอกเดียวกับใบที่นำ**ถ้ายังมีอยู่ ([[follow-suit|ลงตามดอก]]) ใบที่สูงที่สุดของดอกที่นำกิน trick นั้น (A สูงสุด แล้ว K Q J 10 … 2)',
        en: 'The first player [[lead|leads]], then play goes clockwise. Everyone must play the [[suit]] that was led if they have it: you must [[follow-suit|follow suit]]. The highest card of the suit led wins the trick (A is highest, then K Q J 10 … 2).',
      },
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'S5 SK SA S2',
      trump: 'NT',
      caption: {
        th: 'West นำ {S5} · ทุกคนลง {S} ตาม · {SA} สูงสุด East จึงกิน',
        en: 'West leads {S5} · everyone follows with a {S} · {SA} is the highest, so East wins',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ถ้าไม่มีดอกที่นำเหลือเลย ลงใบไหนก็ได้ ([[discard|ทิ้ง]]) แต่ใบนั้นกินไม่ได้ — ยกเว้น [[trump]] (ข้อ 4)',
        en: 'If you have none of the suit led, play any card ([[discard]]), but it cannot win, unless it is a [[trump]] (see 4).',
      },
    },
    { kind: 'h', text: { th: '4. Trump ชนะทุกดอก', en: '4. Trumps beat every other suit' } },
    {
      kind: 'p',
      text: {
        th: 'ดอกท้าย contract คือ [[trump]] (ไพ่ตัด) เช่น 4{S} มี {S} เป็น trump ถ้าไม่มีดอกที่นำ ลง trump ก็กินได้ ([[ruff|ตัด]]) แม้ trump ใบเล็กสุดก็ชนะ A ของดอกอื่น ส่วน [[nt|NT]] คือไม่มี trump',
        en: 'The suit in the contract is [[trump|trumps]]: in 4{S}, {S} are trumps. With none of the suit led, a trump wins the trick ([[ruff]]); even the smallest trump beats the A of another suit. [[nt|NT]] means no trumps.',
      },
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'HK H4 S2 HA',
      trump: 'S',
      caption: {
        th: 'trump คือ {S} · West นำ {HK} · East ไม่มี {H} จึงตัดด้วย {S2} — ชนะ {HA} East จึงกิน',
        en: 'Trumps are {S} · West leads {HK} · East has no {H}, so ruffs with {S2}, which beats {HA}, so East wins',
      },
    },
    { kind: 'h', text: { th: '5. ดูให้ดีว่าถึงตามือไหน', en: '5. Watch whose turn it is' } },
    {
      kind: 'p',
      text: {
        th: '**มือที่กิน trick เป็นคนนำ trick ถัดไป** ถ้า North กิน ต้องนำจากมือ North ถ้าคุณกิน นำจากมือคุณ เกมไฮไลต์มือที่ถึงตาให้ แตะไพ่ครั้งแรกไพ่จะไปรอกลางโต๊ะ แตะอีกครั้งจึงลงจริง',
        en: '**Whoever wins a trick leads the next one.** If North wins, lead from North; if you win, lead from your hand. The game highlights the hand whose turn it is. The first tap sends a card to wait in the middle of the table; tap it again to play it.',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ติดตรงไหน กดปุ่ม **?** บนโต๊ะเพื่อเปิดคู่มือ หรือกด **คำใบ้** ให้เกมบอกใบที่ดีที่สุด อยากรู้ละเอียด อ่านคู่มือเต็มได้ทุกเมื่อ',
        en: 'Stuck? Tap **?** on the table to open the guide, or **Hint** to see the best card. For the details, read the full guide at any time.',
      },
    },
  ],
};

/** The quick guide in one language. */
export const quickGuideIn = perLanguage((lang): QuickGuide => localize(SOURCE, lang) as QuickGuide);

/** The quick guide in Thai (the source language). */
export const QUICK_GUIDE = quickGuideIn('th');
