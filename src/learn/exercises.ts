// Exercises of the guide (SPEC §7.7), as data. Every one is checked by `exercises.test.ts`: the
// format, the answers the rules engine gives, and for play exercises that the solver agrees the
// goal can be made and that each card marked wrong really loses it.

import type { Exercise } from './types';

export const EXERCISES: readonly Exercise[] = [
  // ---------- Chapter 2: tricks and following suit ----------
  {
    id: 'ch2-follow-suit',
    chapter: 2,
    kind: 'legal',
    title: 'ต้องลงตามดอก',
    hands: { N: 'K.3.Q.4', E: '9.5.A.2', S: 'A.A8..K', W: '5.K.7.9' },
    trump: 'NT',
    leader: 'W',
    plays: ['HK', 'H3', 'H5'],
    instruction:
      'West นำ {HK} แล้ว North ลง {H3} East ลง {H5} ถึงตา South (คุณ) — **เลือกทุกใบ**ที่ South ลงได้ แล้วกด "ตรวจคำตอบ"',
    explanation:
      'ดอกที่นำคือ {H} และ South ยังมี {H} อยู่ 2 ใบ ({HA} กับ {H8}) จึงต้อง[[follow-suit|ลงตามดอก]]ด้วยใบใดใบหนึ่งในนี้ ส่วน {SA} กับ {CK} ลงไม่ได้ แม้จะเป็นใบสูง',
    hint: 'ดูว่าใบแรกของ trick นี้เป็นดอกอะไร แล้วหาดอกนั้นในมือ South',
  },
  {
    id: 'ch2-void-discard',
    chapter: 2,
    kind: 'legal',
    title: 'ไม่มีดอกที่นำ',
    hands: { N: '.K.A.5', E: '4..K.3', S: 'A.Q..J', W: '7.2.5.' },
    trump: 'NT',
    leader: 'E',
    plays: ['DK'],
    instruction: 'East นำ {DK} ถึงตา South (คุณ) — **เลือกทุกใบ**ที่ South ลงได้',
    explanation:
      'South ไม่มี {D} เหลือเลย จึง[[discard|ทิ้ง]]ดอกอื่นใบไหนก็ได้ ทั้ง 3 ใบลงได้หมด แต่ใบที่ทิ้งจะไม่กิน trick นี้',
    hint: 'South มี {D} ไหม? ถ้าไม่มี กติกาให้ลงอะไรได้บ้าง',
  },
  {
    id: 'ch2-who-wins',
    chapter: 2,
    kind: 'winner',
    title: 'trick นี้ใครกิน?',
    hands: { N: '...Q', E: '.A..', S: '...3', W: '...5' },
    trump: 'NT',
    leader: 'W',
    plays: ['C5', 'CQ', 'HA', 'C3'],
    instruction: 'West นำ {C5} แล้วทุกคนลงครบ 4 ใบ (ไม่มี [[trump]]) — ใครกิน trick นี้?',
    explanation:
      'ดอกที่นำคือ {C} และ {C} ที่สูงที่สุดคือ {CQ} ของ North — {HA} ของ East สูงก็จริง แต่เป็นใบที่[[discard|ทิ้ง]] ไม่ใช่ดอกที่นำ จึงกินไม่ได้',
    hint: 'ดูเฉพาะไพ่ที่เป็นดอกเดียวกับใบแรก',
  },

  // ---------- Chapter 3: trumps and no trumps ----------
  {
    id: 'ch3-ruff-wins',
    chapter: 3,
    kind: 'winner',
    title: 'ตัดชนะ A',
    hands: { N: '...5', E: '...K', S: '.2..', W: '...A' },
    trump: 'H',
    leader: 'W',
    plays: ['CA', 'C5', 'CK', 'H2'],
    instruction: '[[trump]] คือ {H} · West นำ {CA} แล้วทุกคนลงครบ 4 ใบ — ใครกิน trick นี้?',
    explanation:
      'South ไม่มี {C} จึง[[ruff|ตัด]]ด้วย {H2} ซึ่งเป็น trump — trump ใบเดียวชนะทุกใบของดอกอื่น {CA} ใหญ่ที่สุดใน {C} ก็แพ้ South จึงกิน',
    hint: 'มีใครลง {H} (trump) บ้างไหม?',
  },
  {
    id: 'ch3-overruff',
    chapter: 3,
    kind: 'winner',
    title: 'ตัดซ้อน',
    hands: { N: '..3.', E: '..A.', S: '4...', W: '9...' },
    trump: 'S',
    leader: 'E',
    plays: ['DA', 'S4', 'S9', 'D3'],
    instruction: '[[trump]] คือ {S} · East นำ {DA} แล้วทุกคนลงครบ 4 ใบ — ใครกิน trick นี้?',
    explanation:
      'South กับ West ไม่มี {D} ทั้งคู่ จึงตัดด้วย trump ทั้งคู่ เมื่อมีหลายใบเป็น trump **trump ใบที่ใหญ่ที่สุด**กิน {S9} ใหญ่กว่า {S4} West จึงกิน',
    hint: 'มี trump กี่ใบใน trick นี้ และใบไหนใหญ่ที่สุด?',
  },
  {
    id: 'ch3-ruff-or-discard',
    chapter: 3,
    kind: 'legal',
    title: 'ไม่บังคับให้ตัด',
    hands: { N: 'K.5..3', E: '.3.K.T', S: '4..A.7', W: '.Q.2.2' },
    trump: 'S',
    leader: 'W',
    plays: ['HQ', 'H5', 'H3'],
    instruction:
      '[[trump]] คือ {S} · West นำ {HQ} North ลง {H5} East ลง {H3} ถึงตา South (คุณ) — **เลือกทุกใบ**ที่ South ลงได้',
    explanation:
      'South ไม่มี {H} เหลือ จะ[[ruff|ตัด]]ด้วย {S4} (แล้วกิน trick นี้) หรือ[[discard|ทิ้ง]] {DA} หรือ {C7} ก็ได้ กติกา**ไม่บังคับ**ให้ตัด ทั้ง 3 ใบจึงลงได้',
    hint: 'South มี {H} ไหม? ถ้าไม่มี มีทางเลือกอะไรบ้าง',
  },

  // ---------- Chapter 4: contracts ----------
  {
    id: 'ch4-3nt-tricks',
    chapter: 4,
    kind: 'choice',
    title: '3NT ต้องได้กี่ trick?',
    instruction: '[[contract]] **3NT** ต้องได้กี่ [[trick]]?',
    options: ['3', '6', '9', '10'],
    answer: 2,
    explanation:
      'ตัวเลขใน contract คือจำนวน trick ที่ต้องได้**เกิน 6** จึงต้องได้ 6 + 3 = 9 trick จากทั้งหมด 13',
    hint: 'เลขใน contract ไม่ใช่จำนวน trick ตรง ๆ — ต้องบวก 6 เสมอ',
  },

  {
    id: 'ch4-trump-suit',
    chapter: 4,
    kind: 'choice',
    title: '4{H} มีดอกไหนเป็น trump?',
    instruction: '[[contract]] 4{H} มีดอกไหนเป็น [[trump]]?',
    options: ['{S}', '{H}', '{D}', 'ไม่มี trump'],
    answer: 1,
    explanation:
      'ส่วนท้ายของ contract บอกดอก trump: 4{H} มี {H} เป็น trump (และต้องได้ 6 + 4 = 10 trick) ถ้าไม่มี trump จะเขียนว่า NT เช่น 3NT',
    hint: 'ดูสัญลักษณ์ดอกที่อยู่หลังตัวเลข',
  },
  {
    id: 'ch4-defenders-need',
    chapter: 4,
    kind: 'choice',
    title: 'ฝั่งป้องกันต้องได้กี่ trick?',
    instruction:
      'ฝั่งคุณเล่น 2{S} ฝั่งป้องกันต้องได้**อย่างน้อย**กี่ [[trick]] contract ของคุณจึงไม่สำเร็จ?',
    options: ['2', '5', '6', '8'],
    answer: 2,
    explanation:
      '2{S} ต้องได้ 6 + 2 = 8 trick จาก 13 จึงเสียได้ไม่เกิน 13 − 8 = 5 trick ถ้าฝั่งป้องกันได้ 6 trick ฝั่งคุณจะเหลือแค่ 7 ซึ่งไม่พอ',
    hint: 'หาก่อนว่า 2{S} ต้องได้กี่ trick แล้วคิดว่าเสียได้มากสุดกี่ trick',
  },

  // ---------- Chapter 5: declarer, dummy and defenders ----------
  {
    id: 'ch5-opening-leader',
    chapter: 5,
    kind: 'choice',
    title: 'ใครนำใบแรก?',
    instruction: 'South เป็น [[declarer]] — ใครเป็นคนนำใบแรกของมือ ([[opening-lead]])?',
    options: ['North', 'East', 'South', 'West'],
    answer: 3,
    explanation:
      'opening lead มาจากคนที่นั่ง**ทางซ้ายของ declarer** คือคนถัดไปตามเข็มนาฬิกา: ถัดจาก South คือ West ในเกมนี้ West จึงนำใบแรกเสมอ แล้ว North ([[dummy]]) จึงหงายไพ่',
    hint: 'เวียนตามเข็มนาฬิกา: North → East → South → ?',
  },
  {
    id: 'ch5-who-plays-dummy',
    chapter: 5,
    kind: 'choice',
    title: 'ใครเลือกไพ่ของ dummy?',
    instruction: 'ใครเป็นคนเลือกว่า North ([[dummy]]) จะลงใบไหน?',
    options: ['North เลือกเอง', 'South (คุณ)', 'West', 'ระบบสุ่มให้'],
    answer: 1,
    explanation:
      'dummy หงายไพ่ไว้บนโต๊ะแล้วไม่ได้เลือกอะไรเอง [[declarer]] (South — คุณ) เป็นคนเลือกทุกใบที่ dummy ลง ตาไหนถึง North ให้กดไพ่จาก dummy ด้านบน',
    hint: 'dummy แปลว่ามือหงาย — หงายแล้วใครเล่นแทน?',
  },
  {
    id: 'ch5-dummy-wins',
    chapter: 5,
    kind: 'winner',
    title: 'ใครนำ trick ถัดไป?',
    hands: { N: '...Q', E: '...2', S: '...5', W: '...3' },
    trump: 'NT',
    leader: 'W',
    plays: ['C3', 'CQ', 'C2', 'C5'],
    instruction:
      'ไม่มี trump · West นำ {C3} แล้วทุกคนลงครบ 4 ใบ — ใครกิน trick นี้? (คนที่กินต้องนำ trick ถัดไป)',
    explanation:
      '{CQ} ใหญ่ที่สุดใน {C} North ([[dummy]]) จึงกิน — trick ถัดไปคุณต้อง**นำจากมือ North** ไม่ใช่จากมือ South ของตัวเอง',
    hint: 'ดูใบ {C} ที่ใหญ่ที่สุด',
  },

  // ---------- Chapter 6: scoring ----------
  {
    id: 'ch6-4s-made',
    chapter: 6,
    kind: 'choice',
    title: '4{S} ทำได้พอดี',
    instruction: '4{S} ได้ 10 trick พอดี (ไม่ [[vulnerable]]) ได้กี่แต้ม?',
    options: ['120', '170', '420', '620'],
    answer: 2,
    explanation:
      'แต้มของ trick ตามสัญญา: 4 × 30 = 120 ถึง 100 จึงเป็น [[game]] ได้โบนัส 300 รวม **420** (ถ้า vul โบนัสเป็น 500 รวม 620)',
    hint: '{S} trick ละ 30 แล้วดูว่าถึง 100 หรือไม่',
  },
  {
    id: 'ch6-3nt-down-two',
    chapter: 6,
    kind: 'choice',
    title: '3NT ขาด 2',
    instruction: '**3NT** ได้แค่ 7 trick (ไม่ [[vulnerable]]) ได้กี่แต้ม?',
    options: ['−50', '−100', '−200', '−300'],
    answer: 1,
    explanation:
      '3NT ต้องได้ 9 trick ได้ 7 จึงขาด 2 trick ([[undertrick]]) ไม่ vul เสีย trick ละ 50 รวม **−100**',
    hint: 'ขาดกี่ trick แล้วคูณด้วย 50',
  },
  {
    id: 'ch6-which-game',
    chapter: 6,
    kind: 'choice',
    title: 'contract ไหนเป็น game?',
    instruction: 'contract ไหนเป็น [[game]]?',
    options: ['2{S}', '3{H}', '3NT', '4{D}'],
    answer: 2,
    explanation:
      'game ต้องได้แต้มของ trick ตามสัญญาถึง 100: 3NT = 40 + 30 + 30 = **100** ส่วน 2{S} = 60, 3{H} = 90, 4{D} = 80 ยังไม่ถึง จึงเป็น [[partscore]]',
    hint: '{C} {D} trick ละ 20, {H} {S} trick ละ 30, NT trick แรก 40 ที่เหลือ 30',
  },

  // ---------- Chapter 7: planning ----------
  {
    id: 'ch7-cash-winners',
    chapter: 7,
    kind: 'play',
    title: 'นับ winner แล้วเก็บให้ครบ',
    hands: { N: 'AK.2.3.', E: 'QJ.KQ..', S: '3.A.2.A', W: '..AKQJ.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction:
      'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — นับ [[winner]] ของฝั่งคุณก่อนลงใบแรก (West ถือ {D} ใหญ่ทั้ง 4 ใบ)',
    hint: 'ฝั่งคุณมี winner 4 ใบพอดี: {SA} {SK} {HA} {CA} — ดอกไหนที่ห้ามแตะ และจะเก็บ {SK} ยังไงให้ไม่ค้าง?',
    explanation:
      'winner ของฝั่งคุณมี 4 ใบพอดี: {SA} {SK} ของ North กับ {HA} {CA} ของ South จึงต้อง**เก็บให้ครบโดยไม่เสียการนำ**: นำ {S3} ไป {SA} แล้ว {SK} จากนั้น North นำ {H2} ไปหา {HA} แล้ว {CA} ส่วน {D} เป็นของ West ทั้งดอก ถ้านำ {D} เมื่อไหร่ West ได้นำแล้วกิน {D} ที่เหลือทั้งหมด',
    solution: ['S3', 'SA', 'SK', 'D2', 'H2', 'HA', 'CA', 'D3'],
    wrong: [
      {
        at: 0,
        card: 'D2',
        why: 'นำ {D} แล้ว West กิน และนำ {D} ต่อจนหมดมือ ฝั่งคุณไม่ได้สัก trick',
      },
      {
        at: 4,
        card: 'H2',
        why: 'ไปหา South ก่อนเก็บ {SK} — South ไม่มี {S} พากลับมาที่ North อีก {SK} จึงค้างอยู่',
      },
    ],
  },
  {
    id: 'ch7-count-losers',
    chapter: 7,
    kind: 'play',
    title: 'นับ loser แล้วหาทางทิ้ง',
    hands: { N: '..AKQ.2', E: '.AK.J.3', S: 'AK.2.2.', W: '.QJ.T.4' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction:
      '[[trump]] คือ {S} (ฝั่งป้องกันไม่มี trump แล้ว) · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — นับ [[loser]] ของ South ก่อน',
    hint: '{H2} ของ South เป็น loser — ใน dummy มี winner ดอกไหนที่ South จะหมดก่อน?',
    explanation:
      'South มี loser ใบเดียวคือ {H2} ({HA} {HK} อยู่กับ East) แต่ North มี {D} สูง 3 ใบ ส่วน South มี {D} ใบเดียว: นำ {D2} ไป {DA} แล้ว North นำ {DK} — South ไม่มี {D} แล้ว จึง[[discard|ทิ้ง]] {H2} ได้ loser ก็หายไป ที่เหลือ {DQ} กับ trump ของ South กินหมด',
    solution: ['D2', 'DA', 'DK', 'H2', 'DQ', 'SA', 'SK', 'C2'],
    wrong: [
      {
        at: 0,
        card: 'H2',
        why: 'นำ {H2} ก่อน ฝั่งป้องกันกิน loser ที่ทิ้งได้จึงกลายเป็น trick ที่เสีย',
      },
      {
        at: 4,
        card: 'C2',
        why: 'North นำ {C2} ฝั่งป้องกันกิน trick นั้นไป ยังไม่ทันได้ทิ้ง {H2} ก็เสียไปแล้ว 1 trick',
      },
    ],
  },

  // ---------- Chapter 8: drawing trumps ----------
  {
    id: 'ch8-draw-first',
    chapter: 8,
    kind: 'play',
    title: 'ดึง trump ก่อน',
    hands: { N: '.2.AKQ.', E: '.Q..KQJ', S: '.AK.32.', W: 'AKQ..J.' },
    trump: 'H',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction:
      '[[trump]] คือ {H} · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — East ยังมี trump เหลือ 1 ใบ',
    hint: 'ถ้าเล่น {D} ก่อน คนที่ไม่มี {D} แต่มี trump จะทำอะไรได้?',
    explanation:
      'East มี {HQ} ใบเดียวและไม่มี {D} ถ้าเล่น {D} ก่อน East จะ[[ruff|ตัด]] winner ของ North ทันที จึงต้อง[[draw-trumps|ดึง trump]]ก่อน: {HA} ออกไป {HQ} ของ East ต้องลงตาม แล้ว {D} ทั้ง 3 ใบของ North กินได้ปลอดภัย',
    solution: ['HA', 'H2', 'D2', 'DA', 'DK', 'D3', 'DQ', 'HK'],
    wrong: [
      {
        at: 0,
        card: 'D2',
        why: 'เล่น {D} ก่อนดึง trump — East ไม่มี {D} จึงตัดด้วย {HQ} ได้ 1 trick',
      },
    ],
  },
  {
    id: 'ch8-not-yet',
    chapter: 8,
    kind: 'play',
    title: 'ยังไม่ดึง trump',
    hands: { N: '..AKQ.4', E: 'A.A.98.', S: 'KQ.2.2.', W: '.KQ.J.3' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 3 },
    instruction:
      '[[trump]] คือ {S} · South เป็นคนนำ · ต้องได้ **3 trick** — trump ที่ฝั่งป้องกันเหลือคือ {SA} ของ East',
    hint: '{SA} ต้องกิน 1 trick อยู่แล้ว ก่อนจะยอมให้ East ได้นำ มี loser ใบไหนที่ทิ้งได้?',
    explanation:
      '{SA} ของ East ใหญ่ที่สุด ยังไงก็ต้องเสียให้ 1 trick ถ้าดึง trump ตอนนี้ East ได้นำแล้วกิน {H2} ของ South ด้วย {HA} อีก trick ทางที่ถูกคือ**ยังไม่ดึง**: นำ {D2} ไป {DA} แล้ว {DK} — South ทิ้ง {H2} ไป จากนั้นเสียให้ {SA} แค่ trick เดียว',
    solution: ['D2', 'DA', 'DK', 'H2', 'DQ', 'SQ', 'SK', 'C4'],
    wrong: [
      {
        at: 0,
        card: 'SK',
        why: 'ดึง trump ด้วย {SK} — East กินด้วย {SA} แล้วนำ {HA} กิน {H2} ของ South เสีย 2 trick',
      },
      {
        at: 0,
        card: 'SQ',
        why: 'ดึง trump ด้วย {SQ} — East กินด้วย {SA} แล้วนำ {HA} กิน {H2} ของ South เสีย 2 trick',
      },
    ],
  },

  // ---------- Chapter 9: ruffing in dummy ----------
  {
    id: 'ch9-ruff-first',
    chapter: 9,
    kind: 'play',
    title: 'ตัดก่อนดึง trump',
    hands: { N: '3..32.2', E: '.QJ.A.3', S: 'AKQ.2..', W: 'J.AK.4.' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction:
      '[[trump]] คือ {S} · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — North ไม่มี {H} และมี trump ใบเดียว',
    hint: 'ให้ trump ใบเดียวของ North ตัด {H2} ก่อนที่มันจะต้องลงตามตอนดึง trump',
    explanation:
      '{H2} ของ South เป็น loser แต่ North ไม่มี {H} จึงนำ {H2} ให้ North [[ruff|ตัด]]ด้วย {S3} ได้ trick เพิ่ม แล้ว North นำ {C2} ให้ South ตัดกลับมานำ และ {SA} {SK} กินที่เหลือ ({SJ} ของ West ร่วงลงมาเอง) ถ้าดึง trump ก่อน North ต้องลง {S3} ตาม แล้วไม่มี trump เหลือไว้ตัด',
    solution: ['H2', 'S3', 'C2', 'SQ', 'SA', 'D2', 'SK', 'D3'],
    wrong: [
      {
        at: 0,
        card: 'SA',
        why: 'ดึง trump ก่อน North ต้องลง {S3} ตาม (มี {S} ใบเดียว) จึงไม่เหลือ trump ไว้ตัด {H2}',
      },
    ],
  },
  {
    id: 'ch9-ruff-high',
    chapter: 9,
    kind: 'play',
    title: 'ตัดด้วยใบใหญ่',
    hands: { N: 'K2...2', E: 'J..32.', S: 'A.2..A', W: '.AK..K' },
    trump: 'S',
    leader: 'S',
    goal: { nsTricks: 3 },
    instruction:
      '[[trump]] คือ {S} · South เป็นคนนำ · ต้องได้**ครบ 3 trick** — East ไม่มี {H} และมี trump {SJ}',
    hint: 'East ลง**หลัง** North — ถ้า North ตัดด้วยใบเล็ก East จะทำอะไร?',
    explanation:
      'นำ {H2} ให้ North ตัด แต่ East ลงหลัง North และไม่มี {H} เหมือนกัน ถ้า North ตัดด้วย {S2} East จะตัดซ้อนด้วย {SJ} ให้ North ตัดด้วย {SK} ซึ่ง East ตัดซ้อนไม่ได้ แล้ว North นำ {S2} ไปหา {SA} และ {CA} ของ South',
    solution: ['H2', 'SK', 'S2', 'SA', 'CA', 'C2'],
    wrong: [
      {
        at: 2,
        card: 'S2',
        why: 'ตัดด้วย {S2} — East ตัดซ้อนด้วย {SJ} กิน trick นั้นไป',
      },
    ],
  },

  // ---------- Chapter 10: finesse ----------
  {
    id: 'ch10-finesse-aq',
    chapter: 10,
    kind: 'play',
    title: 'Finesse {SQ}',
    hands: { N: 'AQ.A..', E: '.KQ..A', S: '32...2', W: 'K54...' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 3 },
    instruction:
      'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้**ครบ 3 trick** — คุณเห็นไพ่ทุกมือ และ {SK} อยู่กับ West',
    hint: 'นำ {S} ใบเล็กจาก South **เข้าหา** {SA}{SQ} ของ North แล้วดูว่า West ลงอะไร',
    explanation:
      '{SK} อยู่กับ West ซึ่งลง**ก่อน** North ถ้านำ {S} จาก South แล้ว West ลงใบเล็ก North ก็ลง {SQ} กินได้ (นี่คือ [[finesse]]) แล้ว {SA} กับ {HA} กินได้อีก 2 trick ถ้า West ลง {SK} ก็ขึ้น {SA} แล้ว {SQ} จะกลายเป็นใบสูงสุด',
    solution: ['S2', 'SQ', 'SA', 'S3', 'HA', 'C2'],
    wrong: [
      {
        at: 0,
        card: 'C2',
        why: 'นำ {C} แล้ว East กินด้วย {CA} — South ไม่มีใบไหนกลับมานำอีก จึงไม่ได้นำ {S} เข้าหา {SA}{SQ} และ {SK} จะกิน {SQ}',
      },
      {
        at: 2,
        card: 'SA',
        why: 'ขึ้น {SA} ทันที {SK} ของ West ยังอยู่ และจะกิน {SQ} ใน trick ต่อไป',
      },
    ],
  },
  {
    id: 'ch10-lead-toward-k',
    chapter: 10,
    kind: 'play',
    title: 'นำเข้าหา {SK}',
    hands: { N: 'K3..A.', E: 'JT..8.', S: '54..2.', W: 'AQ..9.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 2 },
    instruction: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้ **2 trick** — {SA} อยู่กับ West',
    hint: 'นำ {S} ใบเล็กจาก South **เข้าหา** {SK} ของ North แล้วดูว่า West ลงอะไร',
    explanation:
      'West ลง**ก่อน** North ถ้านำ {S} ใบเล็กจาก South เข้าหา {SK}: West ลงใบเล็ก North ก็ลง {SK} กินได้ ถ้า West ลง {SA} North ก็ลงใบเล็ก แล้ว {SK} กลายเป็นใบสูงสุด อีก trick คือ {DA} — ถ้าไป North ด้วย {D2} ก่อนแล้วนำ {S} จาก North เอง West จะได้ลง**หลัง** {SK} และ {SK} ไม่ได้ trick',
    solution: ['S4', 'SK', 'DA', 'D2', 'S3', 'S5'],
    wrong: [
      {
        at: 0,
        card: 'D2',
        why: 'ไป North ด้วย {D2} แล้ว North ต้องนำ {S} เอง — West ลงทีหลังจึงรอกิน {SK} ด้วย {SA} ได้',
      },
      {
        at: 2,
        card: 'S3',
        why: 'North ลงใบเล็ก {SQ} ของ West จึงกิน แล้ว {SK} จะเจอ {SA} ทีหลัง',
      },
    ],
  },

  // ---------- Chapter 11: establishing a long suit ----------
  {
    id: 'ch11-knock-out-ace',
    chapter: 11,
    kind: 'play',
    title: 'ไล่ A ออกก่อน',
    hands: { N: 'A..KQJ2.', E: '.KQJT.A.', S: '32.A.43.', W: 'KQJ..65.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction: 'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้ **4 trick** จาก 5 — {DA} อยู่กับ East',
    hint: 'ต้องเสีย {DA} ให้ East อยู่แล้ว ให้เสียตอนที่ {HA} ยังกั้น {H} ของ East อยู่',
    explanation:
      '{D} ของ North จะกินได้ก็ต่อเมื่อ {DA} ออกไปแล้ว จึงนำ {D} ทันทีให้ East กิน {DA} ([[establish]]) ตอนนั้น {HA} ยังเป็น [[stopper]] อยู่ East นำ {H} มา South ก็กิน แล้วนำ {D4} ไปหา {D} ที่เหลือของ North ถ้าใช้ {HA} ไปก่อน พอ East กิน {DA} ก็จะกิน {H} ได้อีกหลาย trick',
    solution: ['D3', 'DK', 'HA', 'SA', 'D4', 'DQ', 'DJ', 'S2', 'D2', 'S3'],
    wrong: [
      {
        at: 0,
        card: 'HA',
        why: 'ใช้ {HA} ไปก่อน — พอ East ได้นำด้วย {DA} ก็กิน {H} ที่เหลือได้หลาย trick',
      },
    ],
  },
  {
    id: 'ch11-duck-first',
    chapter: 11,
    kind: 'play',
    title: 'ยอมเสียรอบแรก',
    hands: { N: '..AK432.', E: 'KQ..987.', S: 'A32..65.', W: 'JT..QJT.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction:
      'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้ **4 trick** — North มี {D} 5 ใบ แต่ไม่มีใบดอกอื่นพาไปหา',
    hint: 'ฝั่งป้องกันมี {D} 6 ใบ ต้องเสีย {D} 1 รอบ และ South มี {D} แค่ 2 ใบ — ควรเสียรอบไหน?',
    explanation:
      'ฝั่งป้องกันมี {D} 3 + 3 ใบ ต้องเล่น 3 รอบกว่าเขาจะหมด และ 1 รอบต้องเสียแน่ ให้เสีย**รอบแรก**: South นำ {D5} แล้ว North ลงใบเล็ก ([[duck]]) South ยังเหลือ {D6} ไว้พาไปหา North รอบต่อไป แล้ว {DA} {DK} {D4} กินหมด ถ้าขึ้น {DA} {DK} ก่อน รอบที่ 3 ก็ยังต้องเสีย แต่ตอนนั้น South ไม่มี {D} พาไปหา North แล้ว',
    solution: ['D5', 'D2', 'D3', 'SA', 'D6', 'DA', 'DK', 'S2', 'D4', 'S3'],
    wrong: [
      {
        at: 2,
        card: 'DA',
        why: 'ขึ้น {DA} รอบแรก — รอบที่ 3 ยังต้องเสียอยู่ดี แต่ตอนนั้น South ไม่มี {D} พาไปหา North แล้ว',
      },
      {
        at: 2,
        card: 'DK',
        why: 'ขึ้น {DK} รอบแรก — รอบที่ 3 ยังต้องเสียอยู่ดี แต่ตอนนั้น South ไม่มี {D} พาไปหา North แล้ว',
      },
    ],
  },

  // ---------- Chapter 12: entries and unblocking ----------
  {
    id: 'ch12-unblock',
    chapter: 12,
    kind: 'play',
    title: 'เล่นใบสูงจากมือที่สั้น',
    hands: { N: '2.2.K3.', E: 'K.A.76.', S: '..AQJ2.', W: 'A..T98.' },
    trump: 'NT',
    leader: 'S',
    goal: { nsTricks: 4 },
    instruction:
      'ไม่มี [[trump]] · South เป็นคนนำ · ต้องได้**ครบ 4 trick** — North มี {D} 2 ใบ ({DK} {D3}) และไม่มีใบอื่นที่กินได้',
    hint: 'มือไหนมี {D} น้อยกว่า? ให้ใบสูงของมือนั้นออกไปก่อน',
    explanation:
      'North มี {D} น้อยกว่า จึงต้อง[[unblock]] {DK} ก่อน: นำ {D2} ไป {DK} แล้ว North นำ {D3} กลับไปหา {DA} {DQ} {DJ} ของ South (หรือนำ {DA} แล้ว North ลง {DK} ตามก็ได้) ถ้า North เก็บ {DK} ไว้ {DK} จะกิน {D} รอบที่ 2 แล้ว North ไม่มี {D} กลับไปหา South {D} ที่เหลือก็ค้างอยู่',
    solution: ['D2', 'DK', 'D3', 'DA', 'DQ', 'S2', 'DJ', 'H2'],
    wrong: [
      {
        at: 2,
        card: 'D3',
        why: 'North ลง {D3} เก็บ {DK} ไว้ — {DK} จะกินรอบต่อไปแล้ว North ไม่มี {D} กลับไปหา South',
      },
    ],
  },
  {
    id: 'ch12-keep-entry',
    chapter: 12,
    kind: 'play',
    title: 'เก็บทางเข้ามือไว้',
    hands: { N: 'A2..KQJ.', E: '98.A.32.', S: 'K43..A.2', W: 'QJT.K..A' },
    trump: 'NT',
    leader: 'W',
    plays: ['SQ'],
    goal: { nsTricks: 5 },
    instruction:
      'ไม่มี [[trump]] · West นำ {SQ} มาแล้ว ถึงตา North · ต้องได้**ครบ 5 trick** — North ต้องมี [[entry]] ไว้ใช้ทีหลัง',
    hint: 'จะให้มือไหนกิน {SQ}? {SA} คือทางเข้ามือเดียวของ North',
    explanation:
      '{D} ของ North จะกินได้ต้องรอ {DA} ของ South ออกก่อน แล้วต้องมีทางกลับไป North อีกครั้ง นั่นคือ {SA} — จึงให้ South กิน {SQ} ด้วย {SK} เก็บ {SA} ไว้ แล้ว South เล่น {DA} นำ {S3} ไปหา {SA} และ {DK} {DQ} กินที่เหลือ',
    solution: ['S2', 'SK', 'DA', 'DJ', 'S3', 'SA', 'DK', 'S4', 'DQ', 'C2'],
    wrong: [
      {
        at: 0,
        card: 'SA',
        why: 'ใช้ {SA} กินตอนนี้ — หลัง {DA} ของ South ออกไป North ไม่เหลือ entry ให้ {DK} {DQ} ได้นำ',
      },
    ],
  },

  // ---------- Chapter 13: hold-up in NT ----------
  {
    id: 'ch13-hold-up-once',
    chapter: 13,
    kind: 'play',
    title: 'ปล่อยรอบแรก',
    hands: { N: '76.A.KQJ.', E: '54.KQJ.A.', S: 'A2..32.43', W: 'KQJT9...2' },
    trump: 'NT',
    leader: 'W',
    plays: ['SK'],
    goal: { nsTricks: 4 },
    instruction:
      'ไม่มี [[trump]] · West นำ {SK} มาแล้ว ถึงตา North · ต้องได้ **4 trick** จาก 6 — {D} ของ North ต้องเสีย {DA} ให้ East ก่อน',
    hint: 'East มี {S} 2 ใบ ถ้ากิน {SA} ตอนนี้ East จะยังมี {S} ไว้ส่งให้ West',
    explanation:
      'West มี {S} 5 ใบ East มีแค่ 2 ใบ และ {SA} ของ South เป็น [[stopper]] ใบเดียว จึง[[hold-up]]: ปล่อยรอบแรกไปก่อน (East ลง {S} ไปแล้ว 1 ใบ) แล้วค่อยใช้ {SA} ในรอบถัดไป ซึ่ง East จะหมด {S} พอดี พอ East กิน {DA} ก็ไม่มี {S} ส่งไปให้ West แล้ว {D} ที่เหลือของ North กินได้ ถ้ากิน {SA} ทันที East ได้นำด้วย {DA} แล้วนำ {S} ให้ West กินอีกหลาย trick',
    solution: ['S6', 'S2', 'S7', 'C4', 'D2', 'DJ', 'C3', 'HA', 'DK', 'D3', 'DQ', 'SA'],
    wrong: [
      {
        at: 2,
        card: 'SA',
        why: 'กิน {SA} ทันที — East ยังเหลือ {S} 1 ใบ ได้นำด้วย {DA} ก็ส่ง {S} ให้ West กินที่เหลือ',
      },
    ],
  },
  {
    id: 'ch13-hold-up-twice',
    chapter: 13,
    kind: 'play',
    title: 'ปล่อยสองรอบ',
    hands: { N: '87.A.KQJ.', E: '654.KQ.A.', S: 'A32..32.4', W: 'KQJT9...2' },
    trump: 'NT',
    leader: 'W',
    plays: ['SK'],
    goal: { nsTricks: 3 },
    instruction:
      'ไม่มี [[trump]] · West นำ {SK} มาแล้ว ถึงตา North · ต้องได้ **3 trick** จาก 6 — {DA} อยู่กับ East',
    hint: 'East มี {S} 3 ใบ ต้องปล่อยกี่รอบ East จึงจะหมด {S}?',
    explanation:
      'East มี {S} 3 ใบ ต้อง[[hold-up|ปล่อย]] 2 รอบ แล้วกิน {SA} รอบที่ 3 ตอนนั้น East หมด {S} พอ East กิน {DA} ก็ไม่มี {S} ส่งไปให้ West แล้ว {HA} กับ {D} ของ North กินที่เหลือ ปล่อยรอบเดียวยังไม่พอ — East ยังเหลือ {S} อีก 1 ใบ',
    solution: ['S7', 'S2', 'S8', 'S3', 'DJ', 'SA', 'D2', 'DQ', 'C4', 'HA', 'DK', 'D3'],
    wrong: [
      {
        at: 2,
        card: 'SA',
        why: 'กิน {SA} ทันที — East ได้นำด้วย {DA} แล้วส่ง {S} ให้ West กินที่เหลือ',
      },
      {
        at: 6,
        card: 'SA',
        why: 'ปล่อยแค่รอบเดียว — East ยังเหลือ {S} 1 ใบ ได้นำด้วย {DA} ก็ส่ง {S} ให้ West กินที่เหลือ',
      },
    ],
  },

  // ---------- Chapter 14: how to practise with this game ----------
  {
    id: 'ch14-bots-see-all',
    chapter: 14,
    kind: 'choice',
    title: 'บอทเห็นไพ่ของใคร?',
    instruction:
      'บอทที่เล่น West กับ East ([[defenders|ฝั่งป้องกัน]]) เห็นไพ่ของใครบ้างตอนเลือกใบ?',
    options: [
      'เห็นแค่มือตัวเอง',
      'มือตัวเองกับ dummy เหมือนคนจริง',
      'เห็นไพ่ทุกมือ',
      'ไม่ดูไพ่ เลือกแบบสุ่ม',
    ],
    answer: 2,
    explanation:
      'บอทเห็นไพ่ทั้ง 4 มือและเลือกใบที่ดีที่สุดเสมอ ([[double-dummy]]) จึงป้องกันแม่นกว่าคนจริง คนจริงเห็นแค่มือตัวเองกับ [[dummy]]',
    hint: 'บทนี้บอกว่าบอทป้องกันได้แม่นกว่าคนจริง เพราะอะไร?',
  },
  {
    id: 'ch14-claim-rejected',
    chapter: 14,
    kind: 'choice',
    title: 'Claim ไม่ผ่าน',
    instruction:
      'คุณ [[claim]] ว่าจะได้อีก 3 trick แต่ฝั่งป้องกันยังมีทางทำให้คุณได้ไม่ถึง 3 — จะเกิดอะไรขึ้น?',
    options: [
      'มือจบทันที และนับว่าขาด',
      'เกมบอกว่าฝั่งป้องกันยังมีทางกิน แล้วให้เล่นต่อ',
      'ได้ 3 trick ตามที่ claim อยู่ดี',
      'ต้องแจกไพ่ใหม่',
    ],
    answer: 1,
    explanation:
      'เกมรับ claim เฉพาะเมื่อฝั่งป้องกันเล่นดีที่สุดแล้วคุณยังได้ตามนั้น ถ้าไม่ได้ เกมแค่ปฏิเสธแล้วให้เล่นต่อจากเดิม ไม่เสียอะไร',
    hint: 'claim ที่ไม่ผ่านไม่ได้ทำให้เสียอะไร',
  },
  {
    id: 'ch14-zero-lost',
    chapter: 14,
    kind: 'choice',
    title: '"เสีย 0 trick" แปลว่าอะไร?',
    instruction: 'หน้าสรุปผลขึ้นว่า **"เสีย 0 trick"** แปลว่าอะไร?',
    options: [
      'ทำ contract ได้พอดี ไม่เกินไม่ขาด',
      'ทุกใบที่ลงดีเท่ากับเล่นแบบเห็นไพ่ทุกมือ',
      'ฝั่งป้องกันไม่ได้ trick เลย',
      'ไม่ได้ใช้คำใบ้',
    ],
    answer: 1,
    explanation:
      'หน้าสรุปเทียบแต่ละใบที่คุณลงกับ [[double-dummy]] ใบไหนทำให้ได้ trick น้อยลงคือจุดที่เสีย "เสีย 0 trick" คือไม่มีใบไหนเสียเลย ได้เท่าที่ทำได้มากที่สุด',
    hint: 'หน้าสรุปเทียบผลของคุณกับอะไร?',
  },
];

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

/** Exercises of chapter `n`, in order. */
export function exercisesOf(n: number): Exercise[] {
  return EXERCISES.filter((e) => e.chapter === n);
}
