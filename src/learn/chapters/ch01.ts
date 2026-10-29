// Chapter 1 (SPEC §7.7): what bridge is — 4 players in 2 teams, the seats, 52 cards, rank order.

import type { Bilingual, Chapter } from '../types';

export const CH1: Chapter<Bilingual> = {
  n: 1,
  title: { th: 'Bridge คืออะไร', en: 'What is bridge?' },
  topic: {
    th: '4 คน 2 ทีม, ทิศ, ไพ่ 52 ใบ, ลำดับใบ',
    en: '4 players in 2 teams, the seats, 52 cards, which card is higher',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'Bridge (บริดจ์) เป็นเกมไพ่สำหรับ **4 คน** แบ่งเป็น **2 ทีม** ทีมละ 2 คน คนในทีมเดียวกันเรียกว่า [[partner]] (คู่) และนั่ง**ตรงข้ามกัน**',
        en: 'Bridge is a card game for **4 players** in **2 teams** of 2. The two players of a team are [[partner|partners]] and sit **opposite each other**.',
      },
    },
    { kind: 'h', text: { th: 'ที่นั่งเรียกตามทิศ', en: 'The seats are named after the compass' } },
    {
      kind: 'p',
      text: {
        th: 'ที่นั่งทั้ง 4 เรียกตามทิศ: **North** (เหนือ), **East** (ตะวันออก), **South** (ใต้) และ **West** (ตะวันตก) North กับ South เป็นทีมเดียวกัน เรียกสั้น ๆ ว่า [[ns-ew|NS]] ส่วน East กับ West เป็นอีกทีม เรียกว่า [[ns-ew|EW]]',
        en: 'The 4 seats are **North**, **East**, **South** and **West**. North and South are one team, [[ns-ew|NS]] for short; East and West are the other team, [[ns-ew|EW]].',
      },
    },
    {
      kind: 'deal',
      hands: {
        N: 'AK74.Q92.K83.J65',
        E: 'QJ9.KT87.962.A84',
        S: 'T53.AJ4.AQJT.KQ7',
        W: '862.653.754.T932',
      },
      caption: {
        th: 'ตัวอย่างการแจกไพ่: ทุกคนถือ 13 ใบ · North กับ South อยู่ทีมเดียวกัน (นั่งตรงข้ามกัน) East กับ West เป็นอีกทีม',
        en: 'A deal: everyone holds 13 cards · North and South are a team (sitting opposite each other), East and West are the other team',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ในเกมนี้ **คุณคือ South** และคุมไพ่ของ North ด้วย (เหตุผลอยู่ในบทที่ 5) ส่วน West กับ East เป็นบอท',
        en: "In this game **you are South** and you also play North's cards (chapter 5 explains why). West and East are bots.",
      },
    },
    { kind: 'h', text: { th: 'ไพ่ 52 ใบ', en: '52 cards' } },
    {
      kind: 'p',
      text: {
        th: 'ใช้ไพ่สำรับปกติ 52 ใบ ไม่มีโจ๊กเกอร์ มี 4 [[suit|ดอก]] (suit) ดอกละ 13 ใบ: {S} spade (โพดำ), {H} heart (โพแดง), {D} diamond (ข้าวหลามตัด) และ {C} club (ดอกจิก) แจกให้ทุกคน คนละ 13 ใบ',
        en: 'Bridge uses an ordinary pack of 52 cards, no jokers. There are 4 [[suit|suits]] of 13 cards each: {S} spades, {H} hearts, {D} diamonds and {C} clubs. Everyone is dealt 13 cards.',
      },
    },
    {
      kind: 'cards',
      cards: 'SA HA DA CA',
      caption: { th: 'ไพ่ 4 ดอก: {S} {H} {D} {C}', en: 'The 4 suits: {S} {H} {D} {C}' },
    },
    { kind: 'h', text: { th: 'ใบไหนใหญ่กว่า', en: 'Which card is higher' } },
    {
      kind: 'p',
      text: {
        th: 'ในดอกเดียวกัน **A ใหญ่ที่สุด** รองลงมาคือ K Q J 10 9 8 7 6 5 4 3 และ **2 เล็กที่สุด** (A ใหญ่กว่า K ไม่ได้เป็นใบเล็กแบบบางเกม)',
        en: 'Within a suit **the ace (A) is highest**, then K Q J 10 9 8 7 6 5 4 3, and **the 2 is lowest** (the ace is always high, never low as in some games).',
      },
    },
    {
      kind: 'cards',
      cards: 'SA SK SQ SJ ST S9 S8 S7 S6 S5 S4 S3 S2',
      caption: {
        th: 'ลำดับใน {S} จากใหญ่ไปเล็ก — ทุกดอกเรียงแบบเดียวกัน',
        en: 'The {S} from highest to lowest — every suit is ranked the same way',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ไพ่ต่างดอกเทียบกันตรง ๆ ไม่ได้ เช่น {HA} กับ {CA} ใบไหนชนะขึ้นอยู่กับว่าใครลงดอกอะไรก่อน (บทที่ 2) และดอกพิเศษที่เรียกว่า [[trump]] (ไพ่ตัด — บทที่ 3)',
        en: 'Cards of different suits cannot be compared directly: whether {HA} or {CA} wins depends on which suit was played first (chapter 2) and on a special suit called [[trump]] (chapter 3).',
      },
    },
    { kind: 'h', text: { th: 'เล่นเพื่ออะไร', en: 'What you play for' } },
    {
      kind: 'p',
      text: {
        th: 'เกมเล่นกันทีละรอบ แต่ละรอบเรียกว่า [[trick]] (ตา — รอบที่ทุกคนลงไพ่คนละ 1 ใบ แล้วใบหนึ่งชนะรอบนั้น) ไพ่คนละ 13 ใบจึงเล่นกัน 13 trick ทีมที่ชนะ trick ไหนก็ได้ trick นั้น',
        en: 'The game is played in rounds. Each round is a [[trick]]: everyone plays one card, and one of the four cards wins the round. With 13 cards each, there are 13 tricks. The team that wins a trick takes it.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ก่อนเล่น ทีมหนึ่งจะ**สัญญา**ว่าจะได้อย่างน้อยกี่ trick เรียกว่า [[contract]] (สัญญา) ทีมนั้นต้องทำให้ได้ตามสัญญา ส่วนอีกทีมพยายามขัดขวาง',
        en: 'Before play, one team **promises** to take at least a certain number of tricks. This promise is the [[contract]]. That team must take the tricks it promised, and the other team tries to stop it.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ในเกมนี้ ทีมที่สัญญาคือทีมของคุณ (NS) เสมอ เป้าหมายของคุณคือ**ได้ trick ให้ครบตาม contract** บทต่อ ๆ ไปจะสอนกติกาทีละขั้น',
        en: 'In this game the team with the contract is always yours (NS). Your goal is to **take all the tricks the contract asks for**. The next chapters teach the rules one step at a time.',
      },
    },
  ],
};
