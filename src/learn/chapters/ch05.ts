// Chapter 5 (SPEC §7.7): declarer, dummy and the defenders; the opening lead; you play both hands.

import type { Chapter } from '../types';

export const CH5: Chapter = {
  n: 5,
  title: 'Declarer, dummy และฝั่งป้องกัน',
  topic: 'ใครเป็นใคร, opening lead, คุณคุมทั้ง South และ North',
  blocks: [
    {
      kind: 'p',
      text: 'เมื่อได้ [[contract]] แล้ว ผู้เล่นทั้ง 4 คนมีหน้าที่ต่างกัน:',
    },
    {
      kind: 'list',
      items: [
        '[[declarer]] (ผู้เล่นตามสัญญา) — คนที่ต้องเล่นให้ได้ตาม contract ในเกมนี้คือ **South (คุณ)**',
        '[[dummy]] (มือหงาย) — [[partner|คู่]]ของ declarer ในเกมนี้คือ **North**',
        '[[defenders]] (ฝั่งป้องกัน) — อีกทีม คือ **West กับ East** พยายามได้ trick ให้มากพอจนสัญญาไม่สำเร็จ',
      ],
    },
    { kind: 'h', text: 'ใบนำแรก' },
    {
      kind: 'p',
      text: 'trick แรกนำโดยคนที่นั่ง**ทางซ้ายของ declarer** (คนถัดไปตามเข็มนาฬิกา) การนำใบแรกนี้เรียกว่า [[opening-lead]] declarer คือ South คนทางซ้ายจึงเป็น **West** — ในเกมนี้ West (บอท) นำใบแรกเสมอ',
    },
    { kind: 'h', text: 'dummy หงายไพ่' },
    {
      kind: 'p',
      text: 'หลังใบนำแรก dummy วางไพ่ทั้งมือ**หงายบนโต๊ะ** เรียงเป็นแถวตามดอกให้ทุกคนเห็น แล้วไม่ต้องทำอะไรอีก — **declarer เป็นคนเลือกทุกใบที่ dummy ลง** และ trick ที่ dummy กินก็นับเป็นของฝั่ง declarer',
    },
    {
      kind: 'deal',
      hands: { N: 'AK74.Q92.K83.J65', S: 'T53.AJ4.AQJT.KQ7' },
      caption:
        'สิ่งที่คุณเห็นระหว่างเล่น: มือของคุณ (South) กับ dummy (North) ที่หงายอยู่ รวม 26 ใบ ส่วนไพ่ของ West กับ East คว่ำอยู่',
    },
    { kind: 'h', text: 'คุณคุมสองมือ' },
    {
      kind: 'p',
      text: 'ในเกมนี้คุณเล่นทั้ง South และ North: ถึงตา North ให้กดไพ่จาก **dummy ด้านบน** ถึงตา South ให้กดจาก**มือด้านล่าง** เกมจะไฮไลต์มือที่ถึงตาให้เห็น',
    },
    {
      kind: 'p',
      text: 'กติกาสำคัญ: **มือที่กิน trick เป็นคนนำ trick ถัดไป** ถ้า dummy กิน ต้องนำจาก dummy ถ้า South กิน ต้องนำจาก South เลือกนำจากมือไหนตามใจไม่ได้',
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'D4 DK D9 D3',
      trump: 'NT',
      caption:
        'West นำ {D4} · {DK} ใหญ่ที่สุด North (dummy) กิน — trick ถัดไปคุณต้องนำจาก**มือ North**',
    },
    {
      kind: 'note',
      text: 'ลำดับในแต่ละ trick ยังเวียนตามเข็มนาฬิกาเหมือนเดิม เช่น West นำ: West → North (dummy) → East → South (คุณ)',
    },
  ],
};
