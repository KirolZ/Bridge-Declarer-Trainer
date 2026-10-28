// Chapter 6 (SPEC §7.7): scoring in brief — enough to read the result screen. The numbers follow
// the engine's duplicate scoring without doubles (SPEC §4.3, src/engine/scoring.ts).

import type { Chapter } from '../types';

export const CH6: Chapter = {
  n: 6,
  title: 'การคิดแต้ม (ย่อ)',
  topic: 'ทำได้ / ไม่ได้, partscore / game / slam, vulnerable',
  blocks: [
    {
      kind: 'p',
      text: 'เมื่อเล่นจบมือ เกมจะคิดแต้มให้เอง บทนี้อธิบายพอให้อ่านหน้าสรุปผลออก ไม่ต้องจำทั้งหมด',
    },
    { kind: 'h', text: 'ทำได้หรือไม่ได้' },
    {
      kind: 'p',
      text: 'ได้ trick **เท่ากับหรือมากกว่า**ที่ [[contract]] ต้องการ = **ทำได้** ได้แต้มบวก ได้น้อยกว่า = **ทำไม่ได้** (ขาด) แต้มติดลบ trick ที่ได้เกินเรียกว่า [[overtrick]] ส่วน trick ที่ขาดเรียกว่า [[undertrick]]',
    },
    { kind: 'h', text: 'แต้มของ trick ตาม contract' },
    {
      kind: 'p',
      text: 'นับเฉพาะ trick เกิน 6 ตามตัวเลขของ contract (ถ้าทำได้):',
    },
    {
      kind: 'list',
      items: [
        '{C} หรือ {D}: trick ละ 20',
        '{H} หรือ {S}: trick ละ 30',
        'NT: trick แรก 40 ที่เหลือ trick ละ 30',
      ],
    },
    { kind: 'h', text: 'partscore, game และ slam' },
    {
      kind: 'p',
      text: 'ถ้าแต้มส่วนนี้**ถึง 100** เรียกว่า [[game]] ได้โบนัสใหญ่ ถ้าไม่ถึงเรียกว่า [[partscore]] ได้โบนัส 50 contract ที่ต่ำที่สุดที่เป็น game คือ 3NT (40 + 30 + 30 = 100), 4{H} หรือ 4{S} (4 × 30 = 120) และ 5{C} หรือ 5{D} (5 × 20 = 100)',
    },
    {
      kind: 'p',
      text: 'contract ระดับ 6 (ต้องได้ 12 trick) เรียกว่า small [[slam]] ระดับ 7 (ต้องได้ครบ 13) เรียกว่า grand slam ได้โบนัสเพิ่มจาก game อีก',
    },
    { kind: 'h', text: 'Vulnerable' },
    {
      kind: 'p',
      text: '[[vulnerable]] (vul) เป็นสถานะที่ทำให้โบนัสสูงขึ้น แต่ถ้าขาดก็เสียแต้มมากขึ้น ในเกมนี้ตั้งได้ในหน้าตั้งค่า (ไม่มีฝ่ายไหน vul หรือ NS vul)',
    },
    {
      kind: 'list',
      items: [
        'partscore: +50',
        'game: +300 (ไม่ vul) / +500 (vul)',
        'small slam: เพิ่มอีก +500 / +750',
        'grand slam: เพิ่มอีก +1000 / +1500',
        'overtrick: trick ละ 20 ใน {C} {D} และ 30 ใน {H} {S} NT',
        'ขาด: trick ละ −50 (ไม่ vul) / −100 (vul)',
      ],
    },
    { kind: 'h', text: 'ตัวอย่าง (ไม่ vul)' },
    {
      kind: 'list',
      items: [
        '4{S} ได้ 10 trick: 4 × 30 = 120 + game 300 = **420**',
        '4{S} ได้ 11 trick: 420 + overtrick 30 = **450**',
        '2{H} ได้ 8 trick: 2 × 30 = 60 + partscore 50 = **110**',
        '3NT ได้ 7 trick: ขาด 2 trick × 50 = **−100**',
      ],
    },
    {
      kind: 'note',
      text: 'เกมนี้ไม่มีการ [[double]] (การท้าให้แต้มเพิ่ม) และหน้าสรุปผลจะบอกแต้มให้เสมอ เป้าหลักของคุณคือ**ทำ contract ให้ได้**',
    },
  ],
};
