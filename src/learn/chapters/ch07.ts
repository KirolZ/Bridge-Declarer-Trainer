// Chapter 7 (SPEC §7.7): planning before the first card — count winners in NT, losers with trumps.

import type { Bilingual, Chapter } from '../types';

export const CH7: Chapter<Bilingual> = {
  n: 7,
  title: { th: 'วางแผนก่อนเล่น', en: 'Plan before you play' },
  topic: {
    th: 'นับ winner ใน NT, นับ loser เมื่อมี trump',
    en: 'Counting winners in NT, counting losers with trumps',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'บทที่ 1–6 คือกติกา ตั้งแต่บทนี้คือ**วิธีเล่นให้ได้ trick มากขึ้น** และเริ่มจากนิสัยที่สำคัญที่สุด: พอ [[dummy]] หงายไพ่แล้ว ให้หยุดดูไพ่ฝั่งคุณทั้งสองมือ แล้ว**นับ**ก่อนลงใบแรก',
        en: "Chapters 1–6 were the rules. From here on it is **how to take more tricks**, starting with the most important habit: once [[dummy]] is face up, stop, look at both of your side's hands, and **count** before playing a card.",
      },
    },
    { kind: 'h', text: { th: 'นับ winner (เมื่อเล่น NT)', en: 'Count winners (in NT)' } },
    {
      kind: 'p',
      text: {
        th: '[[winner]] คือใบที่กิน [[trick]] ได้แน่ทันทีที่เล่น โดยไม่ต้องเสีย trick ให้ใครก่อน ใน [[nt|NT]] ให้นับ winner ทีละดอก โดยดู**สองมือรวมกัน** (South กับ North) นับใบสูงที่เรียงจาก A ลงมาไม่ขาดช่อง',
        en: 'A [[winner]] is a card that takes a [[trick]] the moment you play it, without losing a trick first. In [[nt|NT]], count winners suit by suit across **both hands together** (South and North): the top cards running down from the ace with no gap.',
      },
    },
    {
      kind: 'deal',
      hands: { N: 'AK4.753.KQ2.J654', S: '762.AK2.A53.KQT3' },
      trump: 'NT',
      caption: {
        th: 'contract 3NT (ต้องได้ 9 trick) — ไพ่ของ North (dummy) กับ South (คุณ)',
        en: 'Contract 3NT (9 tricks needed) — the cards of North (dummy) and South (you)',
      },
    },
    {
      kind: 'list',
      items: [
        { th: '{S}: {SA} {SK} = 2 winner', en: '{S}: {SA} {SK} = 2 winners' },
        { th: '{H}: {HA} {HK} = 2 winner', en: '{H}: {HA} {HK} = 2 winners' },
        { th: '{D}: {DA} {DK} {DQ} = 3 winner', en: '{D}: {DA} {DK} {DQ} = 3 winners' },
        { th: '{C}: ไม่มี {CA} จึงยังไม่มี winner เลย', en: '{C}: no {CA}, so no winners yet' },
        { th: 'รวม **7** ขาดอีก 2 trick', en: 'Total **7**, 2 tricks short' },
      ],
    },
    {
      kind: 'p',
      text: {
        th: 'ขาด 2 trick จะหาจากไหน? {C} มี {CK} {CQ} {CJ} {CT} ถ้ายอมเสีย {CA} ให้ฝั่งป้องกันไปก่อน 1 trick ใบที่เหลือจะกลายเป็น winner 3 ใบ (บทที่ 11) แผนจึงเป็น: เล่น {C} **ก่อน** ขณะที่ยังมี A K ของดอกอื่นไว้กันอยู่',
        en: "Where will the 2 missing tricks come from? {C} has {CK} {CQ} {CJ} {CT}: give up one trick to the defenders' {CA} and the 3 cards left become winners (chapter 11). So the plan is: play {C} **first**, while the aces and kings of the other suits still guard them.",
      },
    },
    {
      kind: 'note',
      text: {
        th: 'winner ของดอกหนึ่งได้ไม่เกินจำนวนใบของมือที่มีดอกนั้นมากกว่า เช่น {SA} {SK} ใน North กับ {SQ} ใบเดียวใน South: มี A K Q ครบ แต่ได้แค่ 2 trick เพราะมือที่ยาวกว่า (North) มี {S} แค่ 2 ใบ — {SQ} ต้องลงพร้อม {SA} หรือ {SK} ใน trick เดียวกัน',
        en: 'A suit can give no more winners than the number of cards in the hand that holds more of it. For example, {SA} {SK} in North and a single {SQ} in South: you have the A K Q, but only 2 tricks, because the longer hand (North) has only 2 {S} — {SQ} has to go on {SA} or {SK} in the same trick.',
      },
    },
    { kind: 'h', text: { th: 'นับ loser (เมื่อมี trump)', en: 'Count losers (with trumps)' } },
    {
      kind: 'p',
      text: {
        th: 'เมื่อมี [[trump]] ให้นับอีกแบบ: นับ [[loser]] (ใบที่จะเสีย trick ให้ฝั่งป้องกัน) จากมือ South ซึ่งมี trump ยาวกว่า ทีละดอก แล้วดูว่า North ช่วยปิด loser ไหนได้บ้าง ถ้า loser **มากกว่า**ที่ contract ยอมให้เสีย ต้องหาทางกำจัดก่อนเสียการนำ',
        en: "With [[trump|trumps]], count the other way round: count [[loser|losers]] (cards that will lose a trick to the defenders) suit by suit in South's hand, the longer trump hand, then see which of them North can cover. If there are **more** losers than the contract can afford, you must find a way to get rid of them before you give up the lead.",
      },
    },
    {
      kind: 'deal',
      hands: { N: 'T43.A752.65.A953', S: 'AKQJ5.64.AK3.872' },
      trump: 'S',
      caption: {
        th: 'contract 4{S} (ต้องได้ 10 trick เสียได้ 3) — นับ loser จากมือ South',
        en: "Contract 4{S} (10 tricks needed, 3 can be lost) — counting losers in South's hand",
      },
    },
    {
      kind: 'list',
      items: [
        { th: '{S}: มี A K Q J = 0 loser', en: '{S}: A K Q J = 0 losers' },
        {
          th: '{H}: {H6} {H4} — {HA} ของ North กินรอบแรกได้ รอบที่ 2 เสีย = 1 loser',
          en: "{H}: {H6} {H4} — North's {HA} wins the first round, the second is lost = 1 loser",
        },
        {
          th: '{D}: {DA} {DK} กินได้ {D3} เสีย = 1 loser',
          en: '{D}: {DA} {DK} win, {D3} loses = 1 loser',
        },
        {
          th: '{C}: {C8} {C7} {C2} — {CA} ของ North กินได้ 1 รอบ = 2 loser',
          en: "{C}: {C8} {C7} {C2} — North's {CA} wins one round = 2 losers",
        },
        { th: 'รวม **4** มากกว่าที่เสียได้ 1', en: 'Total **4**, one more than you can lose' },
      ],
    },
    {
      kind: 'p',
      text: {
        th: 'ทางออก: North มี {D} แค่ 2 ใบ หลัง {DA} {DK} North จะหมด {D} แล้วนำ {D3} ให้ North [[ruff|ตัด]]ด้วย trump ได้ (บทที่ 9) loser เหลือ 3 พอดี',
        en: 'The way out: North has only 2 {D}. After {DA} {DK}, North has no {D} left, so lead {D3} and let North [[ruff]] it with a trump (chapter 9). That leaves exactly 3 losers.',
      },
    },
    { kind: 'h', text: { th: 'ทางกำจัด loser', en: 'Ways to get rid of losers' } },
    {
      kind: 'list',
      items: [
        {
          th: '[[discard|ทิ้ง]] loser บน winner ของอีกมือที่เกินมา — เมื่ออีกมือยังมีดอกนั้น แต่มือคุณหมดแล้ว',
          en: '[[discard|Discard]] a loser on a spare winner in the other hand — when the other hand still has that suit but yours has run out',
        },
        {
          th: '[[ruff|ตัด]] loser ด้วย trump ของ dummy (บทที่ 9)',
          en: "[[ruff|Ruff]] a loser with dummy's trumps (chapter 9)",
        },
        {
          th: 'ทำให้ใบในดอกยาวกลายเป็น winner (บทที่ 11) หรือ [[finesse]] (เล่นลอดใบ — บทที่ 10)',
          en: 'Turn small cards of a [[long-suit|long suit]] into winners (chapter 11), or take a [[finesse]] (chapter 10)',
        },
      ],
    },
    {
      kind: 'note',
      text: {
        th: 'ทำแบบนี้ทุกมือก่อนลงใบแรก ใช้เวลาไม่ถึงนาที ถ้าไม่แน่ใจว่านับถูกไหม กด "คำใบ้" ในเกมแล้วดูว่ายังทำได้กี่ trick',
        en: 'Do this on every hand before you play a card — it takes less than a minute. If you are not sure you counted right, press "Hint" in the game and see how many tricks can still be made.',
      },
    },
  ],
};
