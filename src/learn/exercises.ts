// Exercises of the guide (SPEC §7.7), as data. Every one is checked by `exercises.test.ts`: the
// format, the answers the rules engine gives, and for play exercises that the solver agrees the
// goal can be made and that each card marked wrong really loses it.

import type { Language } from '../game/settings';
import { localize, perLanguage } from './localize';
import type { Bilingual, Exercise } from './types';

const SOURCE: readonly Exercise<Bilingual>[] = [
  // ---------- Chapter 2: tricks and following suit ----------
  {
    id: 'ch2-follow-suit',
    chapter: 2,
    kind: 'legal',
    title: { th: 'ต้องลงตามดอก', en: 'Follow suit' },
    hands: { N: 'K.3.Q.4', E: '9.5.A.2', S: 'A.A8..K', W: '5.K.7.9' },
    trump: 'NT',
    leader: 'W',
    plays: ['HK', 'H3', 'H5'],
    instruction: {
      th: 'West นำ {HK} แล้ว North ลง {H3} East ลง {H5} ถึงตา South (คุณ) — **เลือกทุกใบ**ที่ South ลงได้ แล้วกด "ตรวจคำตอบ"',
      en: 'West leads {HK}, North plays {H3}, East plays {H5}, and it is South\'s turn (you) — **pick every card** South may play, then press "Check"',
    },
    explanation: {
      th: 'ดอกที่นำคือ {H} และ South ยังมี {H} อยู่ 2 ใบ ({HA} กับ {H8}) จึงต้อง[[follow-suit|ลงตามดอก]]ด้วยใบใดใบหนึ่งในนี้ ส่วน {SA} กับ {CK} ลงไม่ได้ แม้จะเป็นใบสูง',
      en: 'The suit led is {H}, and South still has 2 {H} ({HA} and {H8}), so South must [[follow-suit|follow suit]] with one of them. {SA} and {CK} cannot be played, even though they are high cards.',
    },
    hint: {
      th: 'ดูว่าใบแรกของ trick นี้เป็นดอกอะไร แล้วหาดอกนั้นในมือ South',
      en: "What suit is the first card of this trick? Look for that suit in South's hand",
    },
  },
  {
    id: 'ch2-void-discard',
    chapter: 2,
    kind: 'legal',
    title: { th: 'ไม่มีดอกที่นำ', en: 'None of the suit led' },
    hands: { N: '.K.A.5', E: '4..K.3', S: 'A.Q..J', W: '7.2.5.' },
    trump: 'NT',
    leader: 'E',
    plays: ['DK'],
    instruction: {
      th: 'East นำ {DK} ถึงตา South (คุณ) — **เลือกทุกใบ**ที่ South ลงได้',
      en: "East leads {DK} and it is South's turn (you) — **pick every card** South may play",
    },
    explanation: {
      th: 'South ไม่มี {D} เหลือเลย จึง[[discard|ทิ้ง]]ดอกอื่นใบไหนก็ได้ ทั้ง 3 ใบลงได้หมด แต่ใบที่ทิ้งจะไม่กิน trick นี้',
      en: 'South has no {D} left, so any card of another suit may be [[discard|discarded]]: all 3 cards can be played. But a discard will not win this trick.',
    },
    hint: {
      th: 'South มี {D} ไหม? ถ้าไม่มี กติกาให้ลงอะไรได้บ้าง',
      en: 'Does South have a {D}? If not, what do the rules allow?',
    },
  },
  {
    id: 'ch2-who-wins',
    chapter: 2,
    kind: 'winner',
    title: { th: 'trick นี้ใครกิน?', en: 'Who wins this trick?' },
    hands: { N: '...Q', E: '.A..', S: '...3', W: '...5' },
    trump: 'NT',
    leader: 'W',
    plays: ['C5', 'CQ', 'HA', 'C3'],
    instruction: {
      th: 'West นำ {C5} แล้วทุกคนลงครบ 4 ใบ (ไม่มี [[trump]]) — ใครกิน trick นี้?',
      en: 'West leads {C5} and all 4 cards are played (no [[trump|trumps]]) — who wins this trick?',
    },
    explanation: {
      th: 'ดอกที่นำคือ {C} และ {C} ที่สูงที่สุดคือ {CQ} ของ North — {HA} ของ East สูงก็จริง แต่เป็นใบที่[[discard|ทิ้ง]] ไม่ใช่ดอกที่นำ จึงกินไม่ได้',
      en: "The suit led is {C}, and the highest {C} is North's {CQ}. East's {HA} is a high card, but it is a [[discard]], not the suit led, so it cannot win.",
    },
    hint: {
      th: 'ดูเฉพาะไพ่ที่เป็นดอกเดียวกับใบแรก',
      en: 'Look only at cards of the same suit as the first one',
    },
  },

  // ---------- Chapter 3: trumps and no trumps ----------
  {
    id: 'ch3-ruff-wins',
    chapter: 3,
    kind: 'winner',
    title: { th: 'ตัดชนะ A', en: 'A ruff beats an ace' },
    hands: { N: '...5', E: '...K', S: '.2..', W: '...A' },
    trump: 'H',
    leader: 'W',
    plays: ['CA', 'C5', 'CK', 'H2'],
    instruction: {
      th: '[[trump]] คือ {H} · West นำ {CA} แล้วทุกคนลงครบ 4 ใบ — ใครกิน trick นี้?',
      en: '[[trump|Trumps]] are {H} · West leads {CA} and all 4 cards are played — who wins this trick?',
    },
    explanation: {
      th: 'South ไม่มี {C} จึง[[ruff|ตัด]]ด้วย {H2} ซึ่งเป็น trump — trump ใบเดียวชนะทุกใบของดอกอื่น {CA} ใหญ่ที่สุดใน {C} ก็แพ้ South จึงกิน',
      en: 'South has no {C}, so [[ruff|ruffs]] with {H2}, a trump — a single trump beats every card of the other suits. {CA} is the highest {C} but still loses, so South wins.',
    },
    hint: { th: 'มีใครลง {H} (trump) บ้างไหม?', en: 'Did anyone play a {H} (a trump)?' },
  },
  {
    id: 'ch3-overruff',
    chapter: 3,
    kind: 'winner',
    title: { th: 'ตัดซ้อน', en: 'Overruff' },
    hands: { N: '..3.', E: '..A.', S: '4...', W: '9...' },
    trump: 'S',
    leader: 'E',
    plays: ['DA', 'S4', 'S9', 'D3'],
    instruction: {
      th: '[[trump]] คือ {S} · East นำ {DA} แล้วทุกคนลงครบ 4 ใบ — ใครกิน trick นี้?',
      en: '[[trump|Trumps]] are {S} · East leads {DA} and all 4 cards are played — who wins this trick?',
    },
    explanation: {
      th: 'South กับ West ไม่มี {D} ทั้งคู่ จึงตัดด้วย trump ทั้งคู่ เมื่อมีหลายใบเป็น trump **trump ใบที่ใหญ่ที่สุด**กิน {S9} ใหญ่กว่า {S4} West จึงกิน',
      en: 'South and West both have no {D}, so both ruff. With more than one trump in the trick, **the highest trump** wins: {S9} beats {S4}, so West wins.',
    },
    hint: {
      th: 'มี trump กี่ใบใน trick นี้ และใบไหนใหญ่ที่สุด?',
      en: 'How many trumps are in this trick, and which is the highest?',
    },
  },
  {
    id: 'ch3-ruff-or-discard',
    chapter: 3,
    kind: 'legal',
    title: { th: 'ไม่บังคับให้ตัด', en: 'You do not have to ruff' },
    hands: { N: 'K.5..3', E: '.3.K.T', S: '4..A.7', W: '.Q.2.2' },
    trump: 'S',
    leader: 'W',
    plays: ['HQ', 'H5', 'H3'],
    instruction: {
      th: '[[trump]] คือ {S} · West นำ {HQ} North ลง {H5} East ลง {H3} ถึงตา South (คุณ) — **เลือกทุกใบ**ที่ South ลงได้',
      en: "[[trump|Trumps]] are {S} · West leads {HQ}, North plays {H5}, East plays {H3}, and it is South's turn (you) — **pick every card** South may play",
    },
    explanation: {
      th: 'South ไม่มี {H} เหลือ จะ[[ruff|ตัด]]ด้วย {S4} (แล้วกิน trick นี้) หรือ[[discard|ทิ้ง]] {DA} หรือ {C7} ก็ได้ กติกา**ไม่บังคับ**ให้ตัด ทั้ง 3 ใบจึงลงได้',
      en: 'South has no {H} left, so may [[ruff]] with {S4} (and win this trick) or [[discard]] {DA} or {C7}. The rules **do not force** a ruff, so all 3 cards can be played.',
    },
    hint: {
      th: 'South มี {H} ไหม? ถ้าไม่มี มีทางเลือกอะไรบ้าง',
      en: 'Does South have a {H}? If not, what are the choices?',
    },
  },

  // ---------- Chapter 4: contracts ----------
  {
    id: 'ch4-3nt-tricks',
    chapter: 4,
    kind: 'choice',
    title: { th: '3NT ต้องได้กี่ trick?', en: 'How many tricks does 3NT need?' },
    instruction: {
      th: '[[contract]] **3NT** ต้องได้กี่ [[trick]]?',
      en: 'How many [[trick|tricks]] does a **3NT** [[contract]] need?',
    },
    options: [
      { th: '3', en: '3' },
      { th: '6', en: '6' },
      { th: '9', en: '9' },
      { th: '10', en: '10' },
    ],
    answer: 2,
    explanation: {
      th: 'ตัวเลขใน contract คือจำนวน trick ที่ต้องได้**เกิน 6** จึงต้องได้ 6 + 3 = 9 trick จากทั้งหมด 13',
      en: 'The number in a contract is the tricks needed **above 6**, so 3NT needs 6 + 3 = 9 of the 13 tricks.',
    },
    hint: {
      th: 'เลขใน contract ไม่ใช่จำนวน trick ตรง ๆ — ต้องบวก 6 เสมอ',
      en: 'The number in a contract is not the tricks themselves — always add 6',
    },
  },

  {
    id: 'ch4-trump-suit',
    chapter: 4,
    kind: 'choice',
    title: { th: '4{H} มีดอกไหนเป็น trump?', en: 'Which suit is trumps in 4{H}?' },
    instruction: {
      th: '[[contract]] 4{H} มีดอกไหนเป็น [[trump]]?',
      en: 'In a 4{H} [[contract]], which suit is [[trump|trumps]]?',
    },
    options: [
      { th: '{S}', en: '{S}' },
      { th: '{H}', en: '{H}' },
      { th: '{D}', en: '{D}' },
      { th: 'ไม่มี trump', en: 'No trumps' },
    ],
    answer: 1,
    explanation: {
      th: 'ส่วนท้ายของ contract บอกดอก trump: 4{H} มี {H} เป็น trump (และต้องได้ 6 + 4 = 10 trick) ถ้าไม่มี trump จะเขียนว่า NT เช่น 3NT',
      en: 'The end of the contract names the trump suit: in 4{H}, {H} are trumps (and you need 6 + 4 = 10 tricks). With no trumps it would say NT, as in 3NT.',
    },
    hint: { th: 'ดูสัญลักษณ์ดอกที่อยู่หลังตัวเลข', en: 'Look at the suit symbol after the number' },
  },
  {
    id: 'ch4-defenders-need',
    chapter: 4,
    kind: 'choice',
    title: { th: 'ฝั่งป้องกันต้องได้กี่ trick?', en: 'How many tricks do the defenders need?' },
    instruction: {
      th: 'ฝั่งคุณเล่น 2{S} ฝั่งป้องกันต้องได้**อย่างน้อย**กี่ [[trick]] contract ของคุณจึงไม่สำเร็จ?',
      en: 'Your side is in 2{S}. How many [[trick|tricks]] must the [[defenders]] take, **at least**, to defeat your contract?',
    },
    options: [
      { th: '2', en: '2' },
      { th: '5', en: '5' },
      { th: '6', en: '6' },
      { th: '8', en: '8' },
    ],
    answer: 2,
    explanation: {
      th: '2{S} ต้องได้ 6 + 2 = 8 trick จาก 13 จึงเสียได้ไม่เกิน 13 − 8 = 5 trick ถ้าฝั่งป้องกันได้ 6 trick ฝั่งคุณจะเหลือแค่ 7 ซึ่งไม่พอ',
      en: '2{S} needs 6 + 2 = 8 of the 13 tricks, so you can lose at most 13 − 8 = 5. If the defenders take 6, your side is left with only 7, which is not enough.',
    },
    hint: {
      th: 'หาก่อนว่า 2{S} ต้องได้กี่ trick แล้วคิดว่าเสียได้มากสุดกี่ trick',
      en: 'First work out how many tricks 2{S} needs, then how many you can afford to lose',
    },
  },

  // ---------- Chapter 5: declarer, dummy and defenders ----------
  {
    id: 'ch5-opening-leader',
    chapter: 5,
    kind: 'choice',
    title: { th: 'ใครนำใบแรก?', en: 'Who makes the first lead?' },
    instruction: {
      th: 'South เป็น [[declarer]] — ใครเป็นคนนำใบแรกของมือ ([[opening-lead]])?',
      en: 'South is [[declarer]] — who leads the first card of the hand (the [[opening-lead]])?',
    },
    options: [
      { th: 'North', en: 'North' },
      { th: 'East', en: 'East' },
      { th: 'South', en: 'South' },
      { th: 'West', en: 'West' },
    ],
    answer: 3,
    explanation: {
      th: 'opening lead มาจากคนที่นั่ง**ทางซ้ายของ declarer** คือคนถัดไปตามเข็มนาฬิกา: ถัดจาก South คือ West ในเกมนี้ West จึงนำใบแรกเสมอ แล้ว North ([[dummy]]) จึงหงายไพ่',
      en: "The opening lead comes from the player **on declarer's left**, the next one clockwise: after South comes West. So in this game West always leads first, and then North ([[dummy]]) goes face up.",
    },
    hint: {
      th: 'เวียนตามเข็มนาฬิกา: North → East → South → ?',
      en: 'Clockwise: North → East → South → ?',
    },
  },
  {
    id: 'ch5-who-plays-dummy',
    chapter: 5,
    kind: 'choice',
    title: { th: 'ใครเลือกไพ่ของ dummy?', en: "Who chooses dummy's cards?" },
    instruction: {
      th: 'ใครเป็นคนเลือกว่า North ([[dummy]]) จะลงใบไหน?',
      en: 'Who chooses which card North ([[dummy]]) plays?',
    },
    options: [
      { th: 'North เลือกเอง', en: 'North chooses' },
      { th: 'South (คุณ)', en: 'South (you)' },
      { th: 'West', en: 'West' },
      { th: 'ระบบสุ่มให้', en: 'The game picks at random' },
    ],
    answer: 1,
    explanation: {
      th: 'dummy หงายไพ่ไว้บนโต๊ะแล้วไม่ได้เลือกอะไรเอง [[declarer]] (South — คุณ) เป็นคนเลือกทุกใบที่ dummy ลง ตาไหนถึง North ให้กดไพ่จาก dummy ด้านบน',
      en: "Dummy lays its cards face up on the table and chooses nothing. [[declarer|Declarer]] (South — you) chooses every card dummy plays. On North's turn, tap a card from dummy at the top.",
    },
    hint: {
      th: 'dummy แปลว่ามือหงาย — หงายแล้วใครเล่นแทน?',
      en: "Dummy's cards are face up on the table — who plays them?",
    },
  },
  {
    id: 'ch5-dummy-wins',
    chapter: 5,
    kind: 'winner',
    title: { th: 'ใครนำ trick ถัดไป?', en: 'Who leads the next trick?' },
    hands: { N: '...Q', E: '...2', S: '...5', W: '...3' },
    trump: 'NT',
    leader: 'W',
    plays: ['C3', 'CQ', 'C2', 'C5'],
    instruction: {
      th: 'ไม่มี trump · West นำ {C3} แล้วทุกคนลงครบ 4 ใบ — ใครกิน trick นี้? (คนที่กินต้องนำ trick ถัดไป)',
      en: 'No trumps · West leads {C3} and all 4 cards are played — who wins this trick? (Whoever wins it must lead to the next trick)',
    },
    explanation: {
      th: '{CQ} ใหญ่ที่สุดใน {C} North ([[dummy]]) จึงกิน — trick ถัดไปคุณต้อง**นำจากมือ North** ไม่ใช่จากมือ South ของตัวเอง',
      en: "{CQ} is the highest {C}, so North ([[dummy]]) wins — for the next trick you must **lead from North's hand**, not from your own South hand.",
    },
    hint: { th: 'ดูใบ {C} ที่ใหญ่ที่สุด', en: 'Look for the highest {C}' },
  },

  // ---------- Chapter 6: scoring ----------
  {
    id: 'ch6-4s-made',
    chapter: 6,
    kind: 'choice',
    title: { th: '4{S} ทำได้พอดี', en: '4{S} made exactly' },
    instruction: {
      th: '4{S} ได้ 10 trick พอดี (ไม่ [[vulnerable]]) ได้กี่แต้ม?',
      en: '4{S} takes exactly 10 tricks (not [[vulnerable]]). What is the score?',
    },
    options: [
      { th: '120', en: '120' },
      { th: '170', en: '170' },
      { th: '420', en: '420' },
      { th: '620', en: '620' },
    ],
    answer: 2,
    explanation: {
      th: 'แต้มของ trick ตามสัญญา: 4 × 30 = 120 ถึง 100 จึงเป็น [[game]] ได้โบนัส 300 รวม **420** (ถ้า vul โบนัสเป็น 500 รวม 620)',
      en: 'Points for the contract tricks: 4 × 30 = 120. That reaches 100, so it is a [[game]] with a bonus of 300: **420** in all (vulnerable, the bonus is 500 and the total 620).',
    },
    hint: {
      th: '{S} trick ละ 30 แล้วดูว่าถึง 100 หรือไม่',
      en: '{S} score 30 a trick — then see whether that reaches 100',
    },
  },
  {
    id: 'ch6-3nt-down-two',
    chapter: 6,
    kind: 'choice',
    title: { th: '3NT ขาด 2', en: '3NT down two' },
    instruction: {
      th: '**3NT** ได้แค่ 7 trick (ไม่ [[vulnerable]]) ได้กี่แต้ม?',
      en: '**3NT** takes only 7 tricks (not [[vulnerable]]). What is the score?',
    },
    options: [
      { th: '−50', en: '−50' },
      { th: '−100', en: '−100' },
      { th: '−200', en: '−200' },
      { th: '−300', en: '−300' },
    ],
    answer: 1,
    explanation: {
      th: '3NT ต้องได้ 9 trick ได้ 7 จึงขาด 2 trick ([[undertrick]]) ไม่ vul เสีย trick ละ 50 รวม **−100**',
      en: '3NT needs 9 tricks; 7 is 2 short ([[undertrick|undertricks]]). Not vulnerable, each one costs 50: **−100**.',
    },
    hint: { th: 'ขาดกี่ trick แล้วคูณด้วย 50', en: 'How many tricks short? Then times 50' },
  },
  {
    id: 'ch6-which-game',
    chapter: 6,
    kind: 'choice',
    title: { th: 'contract ไหนเป็น game?', en: 'Which contract is a game?' },
    instruction: { th: 'contract ไหนเป็น [[game]]?', en: 'Which contract is a [[game]]?' },
    options: [
      { th: '2{S}', en: '2{S}' },
      { th: '3{H}', en: '3{H}' },
      { th: '3NT', en: '3NT' },
      { th: '4{D}', en: '4{D}' },
    ],
    answer: 2,
    explanation: {
      th: 'game ต้องได้แต้มของ trick ตามสัญญาถึง 100: 3NT = 40 + 30 + 30 = **100** ส่วน 2{S} = 60, 3{H} = 90, 4{D} = 80 ยังไม่ถึง จึงเป็น [[partscore]]',
      en: 'A game needs 100 points for the contract tricks: 3NT = 40 + 30 + 30 = **100**. 2{S} = 60, 3{H} = 90 and 4{D} = 80 fall short, so they are [[partscore|partscores]].',
    },
    hint: {
      th: '{C} {D} trick ละ 20, {H} {S} trick ละ 30, NT trick แรก 40 ที่เหลือ 30',
      en: '{C} {D} score 20 a trick, {H} {S} 30, NT 40 for the first trick and 30 after',
    },
  },

  // ---------- Chapter 7: planning ----------
  {
    id: 'ch7-cash-winners',
    chapter: 7,
    kind: 'play',
    title: { th: 'นับ winner แล้วเก็บให้ครบ', en: 'Count your winners and cash them all' },
    hands: { N: 'AK.2.3.', E: 'QJ.KQ..', S: '3.A.2.A', W: '..AKQJ.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: {
      th: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — นับ [[winner]] ของฝั่งคุณก่อนลงใบแรก (West ถือ {D} ใหญ่ทั้ง 4 ใบ)',
      en: "No [[trump|trumps]] · South leads · you need **all 4 tricks** — count your side's [[winner|winners]] before the first card (West holds the 4 top {D})",
    },
    hint: {
      th: 'ฝั่งคุณมี winner 4 ใบพอดี: {SA} {SK} {HA} {CA} — ดอกไหนที่ห้ามแตะ และจะเก็บ {SK} ยังไงให้ไม่ค้าง?',
      en: 'Your side has exactly 4 winners: {SA} {SK} {HA} {CA} — which suit must you not touch, and how do you cash {SK} without it getting stuck?',
    },
    explanation: {
      th: 'winner ของฝั่งคุณมี 4 ใบพอดี: {SA} {SK} ของ North กับ {HA} {CA} ของ South จึงต้อง**เก็บให้ครบโดยไม่เสียการนำ**: นำ {S3} ไป {SA} แล้ว {SK} จากนั้น North นำ {H2} ไปหา {HA} แล้ว {CA} ส่วน {D} เป็นของ West ทั้งดอก ถ้านำ {D} เมื่อไหร่ West ได้นำแล้วกิน {D} ที่เหลือทั้งหมด',
      en: "Your side has exactly 4 winners: North's {SA} {SK} and South's {HA} {CA}, so you must **cash them all without losing the lead**: lead {S3} to {SA}, then {SK}, then North leads {H2} to {HA}, then {CA}. The whole {D} suit belongs to West: lead a {D} at any point and West wins it and runs the rest of the {D}.",
    },
    solution: ['S3', 'SA', 'SK', 'D2', 'H2', 'HA', 'CA', 'D3'],
    wrong: [
      {
        at: 0,
        card: 'D2',
        why: {
          th: 'นำ {D} แล้ว West กิน และนำ {D} ต่อจนหมดมือ ฝั่งคุณไม่ได้สัก trick',
          en: 'You led a {D}: West wins and keeps leading {D} to the end, so your side takes no tricks at all.',
        },
      },
      {
        at: 4,
        card: 'H2',
        why: {
          th: 'ไปหา South ก่อนเก็บ {SK} — South ไม่มี {S} พากลับมาที่ North อีก {SK} จึงค้างอยู่',
          en: 'You went to South before cashing {SK} — South has no {S} to get back to North, so {SK} is stuck.',
        },
      },
    ],
  },
  {
    id: 'ch7-count-losers',
    chapter: 7,
    kind: 'play',
    title: { th: 'นับ loser แล้วหาทางทิ้ง', en: 'Count losers and find a discard' },
    hands: { N: '..AKQ.2', E: '.AK.J.3', S: 'AK.2.2.', W: '.QJ.T.4' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: {
      th: '[[trump]] คือ {S} (ฝั่งป้องกันไม่มี trump แล้ว) · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — นับ [[loser]] ของ South ก่อน',
      en: "[[trump|Trumps]] are {S} (the defenders have none left) · South leads · you need **all 4 tricks** — count South's [[loser|losers]] first",
    },
    hint: {
      th: '{H2} ของ South เป็น loser — ใน dummy มี winner ดอกไหนที่ South จะหมดก่อน?',
      en: "South's {H2} is a loser — which suit has winners in dummy that South runs out of first?",
    },
    explanation: {
      th: 'South มี loser ใบเดียวคือ {H2} ({HA} {HK} อยู่กับ East) แต่ North มี {D} สูง 3 ใบ ส่วน South มี {D} ใบเดียว: นำ {D2} ไป {DA} แล้ว North นำ {DK} — South ไม่มี {D} แล้ว จึง[[discard|ทิ้ง]] {H2} ได้ loser ก็หายไป ที่เหลือ {DQ} กับ trump ของ South กินหมด',
      en: "South has a single loser, {H2} ({HA} {HK} are with East). But North has 3 top {D} and South has only one {D}: lead {D2} to {DA}, then North leads {DK} — South has no {D} left and can [[discard]] {H2}, and the loser is gone. {DQ} and South's trumps win the rest.",
    },
    solution: ['D2', 'DA', 'DK', 'H2', 'DQ', 'SA', 'SK', 'C2'],
    wrong: [
      {
        at: 0,
        card: 'H2',
        why: {
          th: 'นำ {H2} ก่อน ฝั่งป้องกันกิน loser ที่ทิ้งได้จึงกลายเป็น trick ที่เสีย',
          en: 'You led {H2} first: the defenders win it, so the loser you could have discarded becomes a lost trick.',
        },
      },
      {
        at: 4,
        card: 'C2',
        why: {
          th: 'North นำ {C2} ฝั่งป้องกันกิน trick นั้นไป ยังไม่ทันได้ทิ้ง {H2} ก็เสียไปแล้ว 1 trick',
          en: 'North led {C2}: the defenders win that trick, and a trick is lost before you could discard {H2}.',
        },
      },
    ],
  },

  // ---------- Chapter 8: drawing trumps ----------
  {
    id: 'ch8-draw-first',
    chapter: 8,
    kind: 'play',
    title: { th: 'ดึง trump ก่อน', en: 'Draw trumps first' },
    hands: { N: '.2.AKQ.', E: '.Q..KQJ', S: '.AK.32.', W: 'AKQ..J.' },
    trump: 'H',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: {
      th: '[[trump]] คือ {H} · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — East ยังมี trump เหลือ 1 ใบ',
      en: '[[trump|Trumps]] are {H} · South leads · you need **all 4 tricks** — East still has 1 trump',
    },
    hint: {
      th: 'ถ้าเล่น {D} ก่อน คนที่ไม่มี {D} แต่มี trump จะทำอะไรได้?',
      en: 'If you play {D} first, what can a player with no {D} but a trump do?',
    },
    explanation: {
      th: 'East มี {HQ} ใบเดียวและไม่มี {D} ถ้าเล่น {D} ก่อน East จะ[[ruff|ตัด]] winner ของ North ทันที จึงต้อง[[draw-trumps|ดึง trump]]ก่อน: {HA} ออกไป {HQ} ของ East ต้องลงตาม แล้ว {D} ทั้ง 3 ใบของ North กินได้ปลอดภัย',
      en: "East has a single {HQ} and no {D}. Play {D} first and East [[ruff|ruffs]] one of North's winners at once, so [[draw-trumps|draw trumps]] first: lead {HA}, East's {HQ} must follow, and then all 3 of North's {D} win safely.",
    },
    solution: ['HA', 'H2', 'D2', 'DA', 'DK', 'D3', 'DQ', 'HK'],
    wrong: [
      {
        at: 0,
        card: 'D2',
        why: {
          th: 'เล่น {D} ก่อนดึง trump — East ไม่มี {D} จึงตัดด้วย {HQ} ได้ 1 trick',
          en: 'You played {D} before drawing trumps — East has no {D} and ruffs with {HQ} for a trick.',
        },
      },
    ],
  },
  {
    id: 'ch8-not-yet',
    chapter: 8,
    kind: 'play',
    title: { th: 'ยังไม่ดึง trump', en: 'Not drawing trumps yet' },
    hands: { N: '..AKQ.4', E: 'A.A.98.', S: 'KQ.2.2.', W: '.KQ.J.3' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 3 },
    instruction: {
      th: '[[trump]] คือ {S} · South เป็นคนนำ · ต้องได้ **3 trick** — trump ที่ฝั่งป้องกันเหลือคือ {SA} ของ East',
      en: "[[trump|Trumps]] are {S} · South leads · you need **3 tricks** — the defenders' last trump is East's {SA}",
    },
    hint: {
      th: '{SA} ต้องกิน 1 trick อยู่แล้ว ก่อนจะยอมให้ East ได้นำ มี loser ใบไหนที่ทิ้งได้?',
      en: '{SA} will win a trick anyway. Before you let East have the lead, is there a loser you can discard?',
    },
    explanation: {
      th: '{SA} ของ East ใหญ่ที่สุด ยังไงก็ต้องเสียให้ 1 trick ถ้าดึง trump ตอนนี้ East ได้นำแล้วกิน {H2} ของ South ด้วย {HA} อีก trick ทางที่ถูกคือ**ยังไม่ดึง**: นำ {D2} ไป {DA} แล้ว {DK} — South ทิ้ง {H2} ไป จากนั้นเสียให้ {SA} แค่ trick เดียว',
      en: "East's {SA} is the highest trump and must win a trick whatever you do. Draw trumps now and East wins the lead and takes South's {H2} with {HA} for another trick. The right play is **not to draw yet**: lead {D2} to {DA}, then {DK} — South discards {H2} — and then lose just the one trick to {SA}.",
    },
    solution: ['D2', 'DA', 'DK', 'H2', 'DQ', 'SQ', 'SK', 'C4'],
    wrong: [
      {
        at: 0,
        card: 'SK',
        why: {
          th: 'ดึง trump ด้วย {SK} — East กินด้วย {SA} แล้วนำ {HA} กิน {H2} ของ South เสีย 2 trick',
          en: "You drew trumps with {SK} — East wins with {SA}, then leads {HA} to take South's {H2}: 2 tricks lost.",
        },
      },
      {
        at: 0,
        card: 'SQ',
        why: {
          th: 'ดึง trump ด้วย {SQ} — East กินด้วย {SA} แล้วนำ {HA} กิน {H2} ของ South เสีย 2 trick',
          en: "You drew trumps with {SQ} — East wins with {SA}, then leads {HA} to take South's {H2}: 2 tricks lost.",
        },
      },
    ],
  },

  // ---------- Chapter 9: ruffing in dummy ----------
  {
    id: 'ch9-ruff-first',
    chapter: 9,
    kind: 'play',
    title: { th: 'ตัดก่อนดึง trump', en: 'Ruff before drawing trumps' },
    hands: { N: '3..32.2', E: '.QJ.A.3', S: 'AKQ.2..', W: 'J.AK.4.' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: {
      th: '[[trump]] คือ {S} · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — North ไม่มี {H} และมี trump ใบเดียว',
      en: '[[trump|Trumps]] are {S} · South leads · you need **all 4 tricks** — North has no {H} and a single trump',
    },
    hint: {
      th: 'ให้ trump ใบเดียวของ North ตัด {H2} ก่อนที่มันจะต้องลงตามตอนดึง trump',
      en: "Let North's only trump ruff {H2} before it has to follow when trumps are drawn",
    },
    explanation: {
      th: '{H2} ของ South เป็น loser แต่ North ไม่มี {H} จึงนำ {H2} ให้ North [[ruff|ตัด]]ด้วย {S3} ได้ trick เพิ่ม แล้ว North นำ {C2} ให้ South ตัดกลับมานำ และ {SA} {SK} กินที่เหลือ ({SJ} ของ West ร่วงลงมาเอง) ถ้าดึง trump ก่อน North ต้องลง {S3} ตาม แล้วไม่มี trump เหลือไว้ตัด',
      en: "South's {H2} is a loser, but North has no {H}: lead {H2} and let North [[ruff]] with {S3} for an extra trick. Then North leads {C2} for South to ruff back into the lead, and {SA} {SK} win the rest (West's {SJ} falls under them). Draw trumps first and North must follow with {S3}, leaving no trump to ruff with.",
    },
    solution: ['H2', 'S3', 'C2', 'SQ', 'SA', 'D2', 'SK', 'D3'],
    wrong: [
      {
        at: 0,
        card: 'SA',
        why: {
          th: 'ดึง trump ก่อน North ต้องลง {S3} ตาม (มี {S} ใบเดียว) จึงไม่เหลือ trump ไว้ตัด {H2}',
          en: 'You drew trumps first: North had to follow with {S3} (its only {S}), so there is no trump left to ruff {H2}.',
        },
      },
    ],
  },
  {
    id: 'ch9-ruff-high',
    chapter: 9,
    kind: 'play',
    title: { th: 'ตัดด้วยใบใหญ่', en: 'Ruff high' },
    hands: { N: 'K2...2', E: 'J..32.', S: 'A.2..A', W: '.AK..K' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 3 },
    instruction: {
      th: '[[trump]] คือ {S} · South เป็นคนนำ · ต้องได้**ครบ 3 trick** — East ไม่มี {H} และมี trump {SJ}',
      en: '[[trump|Trumps]] are {S} · South leads · you need **all 3 tricks** — East has no {H} and holds the trump {SJ}',
    },
    hint: {
      th: 'East ลง**หลัง** North — ถ้า North ตัดด้วยใบเล็ก East จะทำอะไร?',
      en: 'East plays **after** North — if North ruffs low, what will East do?',
    },
    explanation: {
      th: 'นำ {H2} ให้ North ตัด แต่ East ลงหลัง North และไม่มี {H} เหมือนกัน ถ้า North ตัดด้วย {S2} East จะตัดซ้อนด้วย {SJ} ให้ North ตัดด้วย {SK} ซึ่ง East ตัดซ้อนไม่ได้ แล้ว North นำ {S2} ไปหา {SA} และ {CA} ของ South',
      en: "Lead {H2} for North to ruff — but East plays after North and has no {H} either. If North ruffs with {S2}, East overruffs with {SJ}. Ruff with {SK}, which East cannot beat, then North leads {S2} to South's {SA} and {CA}.",
    },
    solution: ['H2', 'SK', 'S2', 'SA', 'CA', 'C2'],
    wrong: [
      {
        at: 2,
        card: 'S2',
        why: {
          th: 'ตัดด้วย {S2} — East ตัดซ้อนด้วย {SJ} กิน trick นั้นไป',
          en: 'You ruffed with {S2} — East overruffs with {SJ} and wins the trick.',
        },
      },
    ],
  },

  // ---------- Chapter 10: finesse ----------
  {
    id: 'ch10-finesse-aq',
    chapter: 10,
    kind: 'play',
    title: { th: 'Finesse {SQ}', en: 'Finesse the {SQ}' },
    hands: { N: 'AQ.A..', E: '.KQ..A', S: '32...2', W: 'K54...' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 3 },
    instruction: {
      th: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้**ครบ 3 trick** — คุณเห็นไพ่ทุกมือ และ {SK} อยู่กับ West',
      en: 'No [[trump|trumps]] · South leads · you need **all 3 tricks** — you can see every hand, and {SK} is with West',
    },
    hint: {
      th: 'นำ {S} ใบเล็กจาก South **เข้าหา** {SA}{SQ} ของ North แล้วดูว่า West ลงอะไร',
      en: "Lead a small {S} from South **towards** North's {SA}{SQ}, and see what West plays",
    },
    explanation: {
      th: '{SK} อยู่กับ West ซึ่งลง**ก่อน** North ถ้านำ {S} จาก South แล้ว West ลงใบเล็ก North ก็ลง {SQ} กินได้ (นี่คือ [[finesse]]) แล้ว {SA} กับ {HA} กินได้อีก 2 trick ถ้า West ลง {SK} ก็ขึ้น {SA} แล้ว {SQ} จะกลายเป็นใบสูงสุด',
      en: '{SK} is with West, who plays **before** North. Lead a {S} from South: if West plays low, North plays {SQ} and wins (this is a [[finesse]]), and {SA} and {HA} take 2 more tricks. If West plays {SK}, win with {SA} and {SQ} becomes the top card.',
    },
    solution: ['S2', 'SQ', 'SA', 'S3', 'HA', 'C2'],
    wrong: [
      {
        at: 0,
        card: 'C2',
        why: {
          th: 'นำ {C} แล้ว East กินด้วย {CA} — South ไม่มีใบไหนกลับมานำอีก จึงไม่ได้นำ {S} เข้าหา {SA}{SQ} และ {SK} จะกิน {SQ}',
          en: 'You led {C}: East wins with {CA} — South has no way back to the lead, so you never lead {S} towards {SA}{SQ}, and {SK} wins {SQ}.',
        },
      },
      {
        at: 2,
        card: 'SA',
        why: {
          th: 'ขึ้น {SA} ทันที {SK} ของ West ยังอยู่ และจะกิน {SQ} ใน trick ต่อไป',
          en: "You won with {SA} at once: West's {SK} is still there and will win {SQ} on the next round.",
        },
      },
    ],
  },
  {
    id: 'ch10-lead-toward-k',
    chapter: 10,
    kind: 'play',
    title: { th: 'นำเข้าหา {SK}', en: 'Lead towards the {SK}' },
    hands: { N: 'K3..A.', E: 'JT..8.', S: '54..2.', W: 'AQ..9.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 2 },
    instruction: {
      th: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้ **2 trick** — {SA} อยู่กับ West',
      en: 'No [[trump|trumps]] · South leads · you need **2 tricks** — {SA} is with West',
    },
    hint: {
      th: 'นำ {S} ใบเล็กจาก South **เข้าหา** {SK} ของ North แล้วดูว่า West ลงอะไร',
      en: "Lead a small {S} from South **towards** North's {SK}, and see what West plays",
    },
    explanation: {
      th: 'West ลง**ก่อน** North ถ้านำ {S} ใบเล็กจาก South เข้าหา {SK}: West ลงใบเล็ก North ก็ลง {SK} กินได้ ถ้า West ลง {SA} North ก็ลงใบเล็ก แล้ว {SK} กลายเป็นใบสูงสุด อีก trick คือ {DA} — ถ้าไป North ด้วย {D2} ก่อนแล้วนำ {S} จาก North เอง West จะได้ลง**หลัง** {SK} และ {SK} ไม่ได้ trick',
      en: 'West plays **before** North. Lead a small {S} from South towards {SK}: if West plays low, North plays {SK} and wins; if West plays {SA}, North plays low and {SK} becomes the top card. The other trick is {DA}. Go to North with {D2} first and lead {S} from North itself, and West plays **after** {SK}, so {SK} takes no trick.',
    },
    solution: ['S4', 'SK', 'DA', 'D2', 'S3', 'S5'],
    wrong: [
      {
        at: 0,
        card: 'D2',
        why: {
          th: 'ไป North ด้วย {D2} แล้ว North ต้องนำ {S} เอง — West ลงทีหลังจึงรอกิน {SK} ด้วย {SA} ได้',
          en: 'You went to North with {D2}, so North has to lead {S} itself — West plays after it and waits to beat {SK} with {SA}.',
        },
      },
      {
        at: 2,
        card: 'S3',
        why: {
          th: 'North ลงใบเล็ก {SQ} ของ West จึงกิน แล้ว {SK} จะเจอ {SA} ทีหลัง',
          en: "North played low, so West's {SQ} wins, and {SK} runs into {SA} later.",
        },
      },
    ],
  },

  // ---------- Chapter 11: establishing a long suit ----------
  {
    id: 'ch11-knock-out-ace',
    chapter: 11,
    kind: 'play',
    title: { th: 'ไล่ A ออกก่อน', en: 'Knock out the ace first' },
    hands: { N: 'A..KQJ2.', E: '.KQJT.A.', S: '32.A.43.', W: 'KQJ..65.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: {
      th: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้ **4 trick** จาก 5 — {DA} อยู่กับ East',
      en: 'No [[trump|trumps]] · South leads · you need **4 tricks** of 5 — {DA} is with East',
    },
    hint: {
      th: 'ต้องเสีย {DA} ให้ East อยู่แล้ว ให้เสียตอนที่ {HA} ยังกั้น {H} ของ East อยู่',
      en: "You must lose to {DA} anyway — lose it while {HA} still stops East's {H}",
    },
    explanation: {
      th: '{D} ของ North จะกินได้ก็ต่อเมื่อ {DA} ออกไปแล้ว จึงนำ {D} ทันทีให้ East กิน {DA} ([[establish]]) ตอนนั้น {HA} ยังเป็น [[stopper]] อยู่ East นำ {H} มา South ก็กิน แล้วนำ {D4} ไปหา {D} ที่เหลือของ North ถ้าใช้ {HA} ไปก่อน พอ East กิน {DA} ก็จะกิน {H} ได้อีกหลาย trick',
      en: "North's {D} can only win once {DA} is gone, so lead {D} at once and let East win {DA} (you [[establish]] the suit). {HA} is still a [[stopper]]: when East leads {H}, South wins and leads {D4} to North's remaining {D}. Use {HA} first and, when East wins {DA}, East takes several {H} tricks.",
    },
    solution: ['D3', 'DK', 'HA', 'SA', 'D4', 'DQ', 'DJ', 'S2', 'D2', 'S3'],
    wrong: [
      {
        at: 0,
        card: 'HA',
        why: {
          th: 'ใช้ {HA} ไปก่อน — พอ East ได้นำด้วย {DA} ก็กิน {H} ที่เหลือได้หลาย trick',
          en: 'You used {HA} first — when East gets the lead with {DA}, East takes several {H} tricks.',
        },
      },
    ],
  },
  {
    id: 'ch11-duck-first',
    chapter: 11,
    kind: 'play',
    title: { th: 'ยอมเสียรอบแรก', en: 'Give up the first round' },
    hands: { N: '..AK432.', E: 'KQ..987.', S: 'A32..65.', W: 'JT..QJT.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: {
      th: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้ **4 trick** — North มี {D} 5 ใบ แต่ไม่มีใบดอกอื่นพาไปหา',
      en: 'No [[trump|trumps]] · South leads · you need **4 tricks** — North has 5 {D} but no card in another suit to get there',
    },
    hint: {
      th: 'ฝั่งป้องกันมี {D} 6 ใบ ต้องเสีย {D} 1 รอบ และ South มี {D} แค่ 2 ใบ — ควรเสียรอบไหน?',
      en: 'The defenders hold 6 {D}: one round must be lost, and South has only 2 {D} — which round of {D} should you lose?',
    },
    explanation: {
      th: 'ฝั่งป้องกันมี {D} 3 + 3 ใบ ต้องเล่น 3 รอบกว่าเขาจะหมด และ 1 รอบต้องเสียแน่ ให้เสีย**รอบแรก**: South นำ {D5} แล้ว North ลงใบเล็ก ([[duck]]) South ยังเหลือ {D6} ไว้พาไปหา North รอบต่อไป แล้ว {DA} {DK} {D4} กินหมด ถ้าขึ้น {DA} {DK} ก่อน รอบที่ 3 ก็ยังต้องเสีย แต่ตอนนั้น South ไม่มี {D} พาไปหา North แล้ว',
      en: 'The defenders hold 3 + 3 {D}: it takes 3 rounds before they run out, and one round must be lost. Lose the **first** one: South leads {D5} and North plays low (a [[duck]]). South still has {D6} to get to North on the next round, and {DA} {DK} {D4} win the rest. Win {DA} {DK} first and you still lose the third round, but by then South has no {D} to get to North.',
    },
    solution: ['D5', 'D2', 'D3', 'SA', 'D6', 'DA', 'DK', 'S2', 'D4', 'S3'],
    wrong: [
      {
        at: 2,
        card: 'DA',
        why: {
          th: 'ขึ้น {DA} รอบแรก — รอบที่ 3 ยังต้องเสียอยู่ดี แต่ตอนนั้น South ไม่มี {D} พาไปหา North แล้ว',
          en: 'You won the first round with {DA} — the third round is still lost, and by then South has no {D} to get to North.',
        },
      },
      {
        at: 2,
        card: 'DK',
        why: {
          th: 'ขึ้น {DK} รอบแรก — รอบที่ 3 ยังต้องเสียอยู่ดี แต่ตอนนั้น South ไม่มี {D} พาไปหา North แล้ว',
          en: 'You won the first round with {DK} — the third round is still lost, and by then South has no {D} to get to North.',
        },
      },
    ],
  },

  // ---------- Chapter 12: entries and unblocking ----------
  {
    id: 'ch12-unblock',
    chapter: 12,
    kind: 'play',
    title: { th: 'เล่นใบสูงจากมือที่สั้น', en: 'High cards from the short hand' },
    hands: { N: '2.2.K3.', E: 'K.A.76.', S: '..AQJ2.', W: 'A..T98.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: {
      th: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — North มี {D} 2 ใบ ({DK} {D3}) และไม่มีใบอื่นที่กินได้',
      en: 'No [[trump|trumps]] · South leads · you need **all 4 tricks** — North has 2 {D} ({DK} {D3}) and no other card that can win',
    },
    hint: {
      th: 'มือไหนมี {D} น้อยกว่า? ให้ใบสูงของมือนั้นออกไปก่อน',
      en: "Which hand has fewer {D}? Get that hand's high card out first",
    },
    explanation: {
      th: 'North มี {D} น้อยกว่า จึงต้อง[[unblock]] {DK} ก่อน: นำ {D2} ไป {DK} แล้ว North นำ {D3} กลับไปหา {DA} {DQ} {DJ} ของ South (หรือนำ {DA} แล้ว North ลง {DK} ตามก็ได้) ถ้า North เก็บ {DK} ไว้ {DK} จะกิน {D} รอบที่ 2 แล้ว North ไม่มี {D} กลับไปหา South {D} ที่เหลือก็ค้างอยู่',
      en: "North has fewer {D}, so [[unblock]] {DK} first: lead {D2} to {DK}, then North leads {D3} back to South's {DA} {DQ} {DJ} (or lead {DA} and let North drop {DK} under it). If North keeps {DK}, {DK} wins the second round of {D} with no {D} left to get back to South, and the rest of the {D} are stuck.",
    },
    solution: ['D2', 'DK', 'D3', 'DA', 'DQ', 'S2', 'DJ', 'H2'],
    wrong: [
      {
        at: 2,
        card: 'D3',
        why: {
          th: 'North ลง {D3} เก็บ {DK} ไว้ — {DK} จะกินรอบต่อไปแล้ว North ไม่มี {D} กลับไปหา South',
          en: 'North played {D3} and kept {DK} — {DK} wins the next round and North has no {D} to get back to South.',
        },
      },
    ],
  },
  {
    id: 'ch12-keep-entry',
    chapter: 12,
    kind: 'play',
    title: { th: 'เก็บทางเข้ามือไว้', en: 'Keep the entry' },
    hands: { N: 'A2..KQJ.', E: '98.A.32.', S: 'K43..A.2', W: 'QJT.K..A' },
    trump: 'NT',
    leader: 'W',
    plays: ['SQ'],
    goal: { nsTricks: 5 },
    instruction: {
      th: 'ไม่มี [[trump]] · West นำ {SQ} มาแล้ว ถึงตา North · ต้องได้**ครบ 5 trick** — North ต้องมี [[entry]] ไว้ใช้ทีหลัง',
      en: "No [[trump|trumps]] · West has led {SQ} and it is North's turn · you need **all 5 tricks** — North needs an [[entry]] for later",
    },
    hint: {
      th: 'จะให้มือไหนกิน {SQ}? {SA} คือทางเข้ามือเดียวของ North',
      en: "Which hand should win {SQ}? {SA} is North's only entry",
    },
    explanation: {
      th: '{D} ของ North จะกินได้ต้องรอ {DA} ของ South ออกก่อน แล้วต้องมีทางกลับไป North อีกครั้ง นั่นคือ {SA} — จึงให้ South กิน {SQ} ด้วย {SK} เก็บ {SA} ไว้ แล้ว South เล่น {DA} นำ {S3} ไปหา {SA} และ {DK} {DQ} กินที่เหลือ',
      en: "North's {D} can win only after South's {DA} is out of the way, and then you need a way back to North: {SA}. So let South win {SQ} with {SK} and keep {SA}. South then plays {DA}, leads {S3} to {SA}, and {DK} {DQ} win the rest.",
    },
    solution: ['S2', 'SK', 'DA', 'DJ', 'S3', 'SA', 'DK', 'S4', 'DQ', 'C2'],
    wrong: [
      {
        at: 0,
        card: 'SA',
        why: {
          th: 'ใช้ {SA} กินตอนนี้ — หลัง {DA} ของ South ออกไป North ไม่เหลือ entry ให้ {DK} {DQ} ได้นำ',
          en: "You won with {SA} now — once South's {DA} has gone, North has no entry left for {DK} {DQ}.",
        },
      },
    ],
  },

  // ---------- Chapter 13: hold-up in NT ----------
  {
    id: 'ch13-hold-up-once',
    chapter: 13,
    kind: 'play',
    title: { th: 'ปล่อยรอบแรก', en: 'Hold up once' },
    hands: { N: '76.A.KQJ.', E: '54.KQJ.A.', S: 'A2..32.43', W: 'KQJT9...2' },
    trump: 'NT',
    leader: 'W',
    plays: ['SK'],
    goal: { nsTricks: 4 },
    instruction: {
      th: 'ไม่มี [[trump]] · West นำ {SK} มาแล้ว ถึงตา North · ต้องได้ **4 trick** จาก 6 — {D} ของ North ต้องเสีย {DA} ให้ East ก่อน',
      en: "No [[trump|trumps]] · West has led {SK} and it is North's turn · you need **4 tricks** of 6 — North's {D} must lose to East's {DA} first",
    },
    hint: {
      th: 'East มี {S} 2 ใบ ถ้ากิน {SA} ตอนนี้ East จะยังมี {S} ไว้ส่งให้ West',
      en: 'East has 2 {S}. Win {SA} now and East still has a {S} to send back to West',
    },
    explanation: {
      th: 'West มี {S} 5 ใบ East มีแค่ 2 ใบ และ {SA} ของ South เป็น [[stopper]] ใบเดียว จึง[[hold-up]]: ปล่อยรอบแรกไปก่อน (East ลง {S} ไปแล้ว 1 ใบ) แล้วค่อยใช้ {SA} ในรอบถัดไป ซึ่ง East จะหมด {S} พอดี พอ East กิน {DA} ก็ไม่มี {S} ส่งไปให้ West แล้ว {D} ที่เหลือของ North กินได้ ถ้ากิน {SA} ทันที East ได้นำด้วย {DA} แล้วนำ {S} ให้ West กินอีกหลาย trick',
      en: "West has 5 {S} and East only 2, and South's {SA} is the only [[stopper]], so [[hold-up|hold up]]: let the first round go (East has now played one {S}) and use {SA} on the next round, when East runs out of {S}. When East wins {DA}, there is no {S} to send to West, and North's other {D} win. Win {SA} at once and East wins the lead with {DA} and leads {S} for West to take several tricks.",
    },
    solution: ['S6', 'S2', 'S7', 'C4', 'D2', 'DJ', 'C3', 'HA', 'DK', 'D3', 'DQ', 'SA'],
    wrong: [
      {
        at: 2,
        card: 'SA',
        why: {
          th: 'กิน {SA} ทันที — East ยังเหลือ {S} 1 ใบ ได้นำด้วย {DA} ก็ส่ง {S} ให้ West กินที่เหลือ',
          en: 'You won {SA} at once — East still has one {S}, and after winning {DA} sends that {S} to West, who takes the rest.',
        },
      },
    ],
  },
  {
    id: 'ch13-hold-up-twice',
    chapter: 13,
    kind: 'play',
    title: { th: 'ปล่อยสองรอบ', en: 'Hold up twice' },
    hands: { N: '87.A.KQJ.', E: '654.KQ.A.', S: 'A32..32.4', W: 'KQJT9...2' },
    trump: 'NT',
    leader: 'W',
    plays: ['SK'],
    goal: { nsTricks: 3 },
    instruction: {
      th: 'ไม่มี [[trump]] · West นำ {SK} มาแล้ว ถึงตา North · ต้องได้ **3 trick** จาก 6 — {DA} อยู่กับ East',
      en: "No [[trump|trumps]] · West has led {SK} and it is North's turn · you need **3 tricks** of 6 — {DA} is with East",
    },
    hint: {
      th: 'East มี {S} 3 ใบ ต้องปล่อยกี่รอบ East จึงจะหมด {S}?',
      en: 'East has 3 {S}. How many rounds must you hold up before East runs out of {S}?',
    },
    explanation: {
      th: 'East มี {S} 3 ใบ ต้อง[[hold-up|ปล่อย]] 2 รอบ แล้วกิน {SA} รอบที่ 3 ตอนนั้น East หมด {S} พอ East กิน {DA} ก็ไม่มี {S} ส่งไปให้ West แล้ว {HA} กับ {D} ของ North กินที่เหลือ ปล่อยรอบเดียวยังไม่พอ — East ยังเหลือ {S} อีก 1 ใบ',
      en: "East has 3 {S}, so [[hold-up|hold up]] twice and win {SA} on the third round, when East is out of {S}. When East wins {DA}, there is no {S} left to send to West, and {HA} and North's {D} win the rest. Holding up once is not enough — East still has one {S}.",
    },
    solution: ['S7', 'S2', 'S8', 'S3', 'DJ', 'SA', 'D2', 'DQ', 'C4', 'HA', 'DK', 'D3'],
    wrong: [
      {
        at: 2,
        card: 'SA',
        why: {
          th: 'กิน {SA} ทันที — East ได้นำด้วย {DA} แล้วส่ง {S} ให้ West กินที่เหลือ',
          en: 'You won {SA} at once — East wins the lead with {DA} and sends a {S} to West, who takes the rest.',
        },
      },
      {
        at: 6,
        card: 'SA',
        why: {
          th: 'ปล่อยแค่รอบเดียว — East ยังเหลือ {S} 1 ใบ ได้นำด้วย {DA} ก็ส่ง {S} ให้ West กินที่เหลือ',
          en: 'You held up only once — East still has one {S}, and after winning {DA} sends that {S} to West, who takes the rest.',
        },
      },
    ],
  },

  // ---------- Chapter 14: how to practise with this game ----------
  {
    id: 'ch14-bots-see-all',
    chapter: 14,
    kind: 'choice',
    title: { th: 'บอทเห็นไพ่ของใคร?', en: 'Whose cards do the bots see?' },
    instruction: {
      th: 'บอทที่เล่น West กับ East ([[defenders|ฝั่งป้องกัน]]) เห็นไพ่ของใครบ้างตอนเลือกใบ?',
      en: 'The bots playing West and East (the [[defenders]]) — whose cards do they see when they choose a card?',
    },
    options: [
      { th: 'เห็นแค่มือตัวเอง', en: 'Only their own hand' },
      { th: 'มือตัวเองกับ dummy เหมือนคนจริง', en: 'Their own hand and dummy, like real players' },
      { th: 'เห็นไพ่ทุกมือ', en: 'Every hand' },
      { th: 'ไม่ดูไพ่ เลือกแบบสุ่ม', en: 'None — they choose at random' },
    ],
    answer: 2,
    explanation: {
      th: 'บอทเห็นไพ่ทั้ง 4 มือและเลือกใบที่ดีที่สุดเสมอ ([[double-dummy]]) จึงป้องกันแม่นกว่าคนจริง คนจริงเห็นแค่มือตัวเองกับ [[dummy]]',
      en: 'The bots see all 4 hands and always choose the best card ([[double-dummy]]), so they defend more accurately than real people, who see only their own hand and [[dummy]].',
    },
    hint: {
      th: 'บทนี้บอกว่าบอทป้องกันได้แม่นกว่าคนจริง เพราะอะไร?',
      en: 'This chapter says the bots defend more accurately than real people. Why?',
    },
  },
  {
    id: 'ch14-claim-rejected',
    chapter: 14,
    kind: 'choice',
    title: { th: 'Claim ไม่ผ่าน', en: 'A claim that is refused' },
    instruction: {
      th: 'คุณ [[claim]] ว่าจะได้อีก 3 trick แต่ฝั่งป้องกันยังมีทางทำให้คุณได้ไม่ถึง 3 — จะเกิดอะไรขึ้น?',
      en: 'You [[claim]] 3 more tricks, but the defenders can still stop you from taking 3 — what happens?',
    },
    options: [
      { th: 'มือจบทันที และนับว่าขาด', en: 'The hand ends at once and counts as down' },
      {
        th: 'เกมบอกว่าฝั่งป้องกันยังมีทางกิน แล้วให้เล่นต่อ',
        en: 'The game says the defenders can still take tricks, and you play on',
      },
      { th: 'ได้ 3 trick ตามที่ claim อยู่ดี', en: 'You get the 3 tricks you claimed anyway' },
      { th: 'ต้องแจกไพ่ใหม่', en: 'A new hand is dealt' },
    ],
    answer: 1,
    explanation: {
      th: 'เกมรับ claim เฉพาะเมื่อฝั่งป้องกันเล่นดีที่สุดแล้วคุณยังได้ตามนั้น ถ้าไม่ได้ เกมแค่ปฏิเสธแล้วให้เล่นต่อจากเดิม ไม่เสียอะไร',
      en: 'The game accepts a claim only if you still get the tricks against the best defence. If not, it simply refuses and you play on from where you were, with nothing lost.',
    },
    hint: { th: 'claim ที่ไม่ผ่านไม่ได้ทำให้เสียอะไร', en: 'A refused claim costs you nothing' },
  },
  {
    id: 'ch14-zero-lost',
    chapter: 14,
    kind: 'choice',
    title: { th: '"เสีย 0 trick" แปลว่าอะไร?', en: 'What does "no tricks lost" mean?' },
    instruction: {
      th: 'หน้าสรุปผลขึ้นว่า **"เสีย 0 trick"** แปลว่าอะไร?',
      en: 'The summary says **"No tricks lost"**. What does that mean?',
    },
    options: [
      {
        th: 'ทำ contract ได้พอดี ไม่เกินไม่ขาด',
        en: 'The contract was made exactly, no more, no less',
      },
      {
        th: 'ทุกใบที่ลงดีเท่ากับเล่นแบบเห็นไพ่ทุกมือ',
        en: 'Every card was as good as playing with all hands in view',
      },
      { th: 'ฝั่งป้องกันไม่ได้ trick เลย', en: 'The defenders took no tricks' },
      { th: 'ไม่ได้ใช้คำใบ้', en: 'No hints were used' },
    ],
    answer: 1,
    explanation: {
      th: 'หน้าสรุปเทียบแต่ละใบที่คุณลงกับ [[double-dummy]] ใบไหนทำให้ได้ trick น้อยลงคือจุดที่เสีย "เสีย 0 trick" คือไม่มีใบไหนเสียเลย ได้เท่าที่ทำได้มากที่สุด',
      en: 'The summary compares each card you played with [[double-dummy]] play; a card that leads to fewer tricks is where a trick was lost. "No tricks lost" means no card lost anything — you took as many tricks as could be taken.',
    },
    hint: {
      th: 'หน้าสรุปเทียบผลของคุณกับอะไร?',
      en: 'What does the summary compare your play with?',
    },
  },
];

/** Every exercise in one language. */
export const exercisesIn = perLanguage((lang): readonly Exercise[] =>
  SOURCE.map((e) => localize(e, lang) as Exercise),
);

/** The exercises in Thai (the source language; tests and checks that need no language). */
export const EXERCISES = exercisesIn('th');

export function exerciseById(id: string, lang: Language = 'th'): Exercise | undefined {
  return exercisesIn(lang).find((e) => e.id === id);
}

/** Exercises of chapter `n`, in order. */
export function exercisesOf(n: number, lang: Language = 'th'): Exercise[] {
  return exercisesIn(lang).filter((e) => e.chapter === n);
}
