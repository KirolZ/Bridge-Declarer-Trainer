// Chapter 2 (SPEC §7.7): tricks, following suit, who wins, discarding.

import type { Bilingual, Chapter } from '../types';

export const CH2: Chapter<Bilingual> = {
  n: 2,
  title: { th: 'Trick และการลงตามดอก', en: 'Tricks and following suit' },
  topic: {
    th: 'ใครนำ, ต้องลงตามดอก, ใบไหนกิน, ทิ้งดอกอื่น',
    en: 'Who leads, following suit, which card wins, discarding',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'Bridge เล่นกันเป็นรอบ ๆ แต่ละรอบเรียกว่า [[trick]] (ตา — รอบที่ทุกคนลงไพ่คนละ 1 ใบ) แต่ละคนถือไพ่ 13 ใบ จึงเล่นกันทั้งหมด 13 trick',
        en: 'Bridge is played in rounds, each one a [[trick]]: everyone plays one card. Each player holds 13 cards, so there are 13 tricks in all.',
      },
    },
    { kind: 'h', text: { th: 'ใครลงก่อน', en: 'Who plays first' } },
    {
      kind: 'p',
      text: {
        th: 'คนที่ลงใบแรกของ trick เรียกว่าคน [[lead|นำ]] (lead) จากนั้นคนอื่นลงต่อทีละคน **เวียนตามเข็มนาฬิกา** เช่น ถ้า West นำ ต่อไปคือ North, East แล้วจบที่ South',
        en: 'The player who plays the first card of a trick [[lead|leads]]. The others then play one at a time, **clockwise**: if West leads, North plays next, then East, and South last.',
      },
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'S5 SK SA S2',
      trump: 'NT',
      caption: {
        th: 'West นำ {S5} แล้วเวียนไป North → East → South (เลขบนไพ่คือลำดับที่ลง) · {SA} สูงสุด East จึงกิน trick นี้',
        en: 'West leads {S5}, then North → East → South (the number on each card is the order of play) · {SA} is the highest, so East wins the trick',
      },
    },
    { kind: 'h', text: { th: 'ต้องลงตามดอก', en: 'Following suit' } },
    {
      kind: 'p',
      text: {
        th: 'ดอกของใบแรกเรียกว่า**ดอกที่นำ** ทุกคนต้องลงดอกเดียวกันถ้ายังมีอยู่ในมือ เรียกว่า [[follow-suit|ลงตามดอก]] (follow suit) จะเลือกใบไหนของดอกนั้นก็ได้',
        en: 'The suit of the first card is the **suit led**. Everyone must play a card of that suit if they still have one — this is called [[follow-suit|following suit]]. Any card of the suit will do.',
      },
    },
    {
      kind: 'hand',
      seat: 'S',
      hand: 'A8.Q73.K5.J4',
      caption: {
        th: 'ถ้ามีคนนำ {H} มา South ต้องลง {HQ} {H7} หรือ {H3} — จะลง {SA} ไม่ได้ เพราะยังมี {H} อยู่ในมือ',
        en: 'If {H} is led, South must play {HQ}, {H7} or {H3} — not {SA}, because South still has {H}',
      },
    },
    { kind: 'h', text: { th: 'ใบไหนกิน', en: 'Which card wins' } },
    {
      kind: 'p',
      text: {
        th: 'เมื่อครบ 4 ใบ **ใบที่สูงที่สุดของดอกที่นำ**จะกิน trick นั้น ลำดับจากสูงไปต่ำคือ A K Q J 10 9 8 7 6 5 4 3 2 (A สูงสุด)',
        en: 'Once all 4 cards are down, **the highest card of the suit led** wins the trick. From highest to lowest: A K Q J 10 9 8 7 6 5 4 3 2.',
      },
    },
    {
      kind: 'cards',
      cards: 'HA HK HQ HJ HT H9 H2',
      caption: {
        th: 'ลำดับจากสูงไปต่ำ: A ชนะทุกใบ, 2 ต่ำสุด',
        en: 'From highest to lowest: the A beats every card, the 2 is the lowest',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'คนที่กินได้ trick นั้นไปให้ฝั่งของตัวเอง แล้วเป็นคนนำ trick ถัดไป',
        en: 'The player who wins the trick takes it for their side, and leads to the next trick.',
      },
    },
    { kind: 'h', text: { th: 'ไม่มีดอกที่นำ', en: 'No card of the suit led' } },
    {
      kind: 'p',
      text: {
        th: 'ถ้าไม่มีดอกที่นำเหลืออยู่เลย จะลงดอกอื่นใบไหนก็ได้ เรียกว่า [[discard|ทิ้ง]] (discard) ใบที่ทิ้ง**ไม่มีทางกิน** แม้จะเป็น A ก็ตาม',
        en: 'A player who has no card of the suit led may play any other card. This is a [[discard]]. A discard **can never win**, even an ace.',
      },
    },
    {
      kind: 'trick',
      leader: 'N',
      cards: 'D4 D9 SA DJ',
      trump: 'NT',
      caption: {
        th: 'North นำ {D4} · South ไม่มี {D} จึงทิ้ง {SA} — แต่ใบที่สูงสุดของดอกที่นำ ({D}) คือ {DJ} West จึงกิน',
        en: 'North leads {D4} · South has no {D}, so discards {SA} — but the highest card of the suit led ({D}) is {DJ}, so West wins',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ข้อยกเว้นเดียวคือดอก [[trump]] (ไพ่ตัด) ซึ่งชนะดอกอื่นได้ จะเรียนในบทที่ 3 · ในเกมนี้ใบที่ลงไม่ได้จะจางลงและกดไม่ได้ จึงลงผิดกติกาไม่ได้',
        en: 'The one exception is the [[trump]] suit, which beats the other suits — that is chapter 3 · In this game, cards you cannot play are faded and cannot be tapped, so you cannot break the rules by mistake.',
      },
    },
  ],
};
