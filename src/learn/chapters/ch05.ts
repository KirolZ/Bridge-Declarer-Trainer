// Chapter 5 (SPEC §7.7): declarer, dummy and the defenders; the opening lead; you play both hands.

import type { Bilingual, Chapter } from '../types';

export const CH5: Chapter<Bilingual> = {
  n: 5,
  title: { th: 'Declarer, dummy และฝั่งป้องกัน', en: 'Declarer, dummy and the defenders' },
  topic: {
    th: 'ใครเป็นใคร, opening lead, คุณคุมทั้ง South และ North',
    en: 'Who is who, the opening lead, you play both South and North',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'เมื่อได้ [[contract]] แล้ว ผู้เล่นทั้ง 4 คนมีหน้าที่ต่างกัน:',
        en: 'Once the [[contract]] is set, the 4 players have different jobs:',
      },
    },
    {
      kind: 'list',
      items: [
        {
          th: '[[declarer]] (ผู้เล่นตามสัญญา) — คนที่ต้องเล่นให้ได้ตาม contract ในเกมนี้คือ **South (คุณ)**',
          en: '[[declarer]] — the player who must make the contract; in this game, **South (you)**',
        },
        {
          th: '[[dummy]] (มือหงาย) — [[partner|คู่]]ของ declarer ในเกมนี้คือ **North**',
          en: "[[dummy]] — declarer's [[partner]]; in this game, **North**",
        },
        {
          th: '[[defenders]] (ฝั่งป้องกัน) — อีกทีม คือ **West กับ East** พยายามได้ trick ให้มากพอจนสัญญาไม่สำเร็จ',
          en: '[[defenders]] — the other team, **West and East**, who try to take enough tricks to defeat the contract',
        },
      ],
    },
    { kind: 'h', text: { th: 'ใบนำแรก', en: 'The first lead' } },
    {
      kind: 'p',
      text: {
        th: 'trick แรกนำโดยคนที่นั่ง**ทางซ้ายของ declarer** (คนถัดไปตามเข็มนาฬิกา) การนำใบแรกนี้เรียกว่า [[opening-lead]] declarer คือ South คนทางซ้ายจึงเป็น **West** — ในเกมนี้ West (บอท) นำใบแรกเสมอ',
        en: "The first trick is led by the player **on declarer's left** (the next player clockwise). This first lead is the [[opening-lead]]. Declarer is South, so the player on the left is **West** — in this game West (a bot) always makes the opening lead.",
      },
    },
    { kind: 'h', text: { th: 'dummy หงายไพ่', en: 'Dummy goes face up' } },
    {
      kind: 'p',
      text: {
        th: 'หลังใบนำแรก dummy วางไพ่ทั้งมือ**หงายบนโต๊ะ** เรียงเป็นแถวตามดอกให้ทุกคนเห็น แล้วไม่ต้องทำอะไรอีก — **declarer เป็นคนเลือกทุกใบที่ dummy ลง** และ trick ที่ dummy กินก็นับเป็นของฝั่ง declarer',
        en: "After the opening lead, dummy lays the whole hand **face up on the table**, sorted into suits for everyone to see, and takes no further part — **declarer chooses every card dummy plays**, and the tricks dummy wins count for declarer's side.",
      },
    },
    {
      kind: 'deal',
      hands: { N: 'AK74.Q92.K83.J65', S: 'T53.AJ4.AQJT.KQ7' },
      caption: {
        th: 'สิ่งที่คุณเห็นระหว่างเล่น: มือของคุณ (South) กับ dummy (North) ที่หงายอยู่ รวม 26 ใบ ส่วนไพ่ของ West กับ East คว่ำอยู่',
        en: "What you see while playing: your hand (South) and dummy (North) face up, 26 cards in all; West's and East's cards are face down",
      },
    },
    { kind: 'h', text: { th: 'คุณคุมสองมือ', en: 'You play two hands' } },
    {
      kind: 'p',
      text: {
        th: 'ในเกมนี้คุณเล่นทั้ง South และ North: ถึงตา North ให้กดไพ่จาก **dummy ด้านบน** ถึงตา South ให้กดจาก**มือด้านล่าง** เกมจะไฮไลต์มือที่ถึงตาให้เห็น',
        en: "In this game you play both South and North: on North's turn, tap a card from **dummy at the top**; on South's turn, tap a card from **the hand at the bottom**. The game highlights the hand whose turn it is.",
      },
    },
    {
      kind: 'p',
      text: {
        th: 'กติกาสำคัญ: **มือที่กิน trick เป็นคนนำ trick ถัดไป** ถ้า dummy กิน ต้องนำจาก dummy ถ้า South กิน ต้องนำจาก South เลือกนำจากมือไหนตามใจไม่ได้',
        en: 'An important rule: **the hand that wins a trick leads to the next one**. If dummy wins, you must lead from dummy; if South wins, you must lead from South. You cannot choose which hand to lead from.',
      },
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'D4 DK D9 D3',
      trump: 'NT',
      caption: {
        th: 'West นำ {D4} · {DK} ใหญ่ที่สุด North (dummy) กิน — trick ถัดไปคุณต้องนำจาก**มือ North**',
        en: "West leads {D4} · {DK} is the highest, so North (dummy) wins — you must lead the next trick from **North's hand**",
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ลำดับในแต่ละ trick ยังเวียนตามเข็มนาฬิกาเหมือนเดิม เช่น West นำ: West → North (dummy) → East → South (คุณ)',
        en: 'The order within each trick is still clockwise. If West leads: West → North (dummy) → East → South (you).',
      },
    },
  ],
};
