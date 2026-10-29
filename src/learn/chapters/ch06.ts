// Chapter 6 (SPEC §7.7): scoring in brief — enough to read the result screen. The numbers follow
// the engine's duplicate scoring without doubles (SPEC §4.3, src/engine/scoring.ts).

import type { Bilingual, Chapter } from '../types';

export const CH6: Chapter<Bilingual> = {
  n: 6,
  title: { th: 'การคิดแต้ม (ย่อ)', en: 'Scoring (in short)' },
  topic: {
    th: 'ทำได้ / ไม่ได้, partscore / game / slam, vulnerable',
    en: 'Made or down, partscore / game / slam, vulnerable',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'เมื่อเล่นจบมือ เกมจะคิดแต้มให้เอง บทนี้อธิบายพอให้อ่านหน้าสรุปผลออก ไม่ต้องจำทั้งหมด',
        en: 'When a hand is over, the game works out the score for you. This chapter explains just enough to read the summary — there is no need to learn it all.',
      },
    },
    { kind: 'h', text: { th: 'ทำได้หรือไม่ได้', en: 'Made or not' } },
    {
      kind: 'p',
      text: {
        th: 'ได้ trick **เท่ากับหรือมากกว่า**ที่ [[contract]] ต้องการ = **ทำได้** ได้แต้มบวก ได้น้อยกว่า = **ทำไม่ได้** (ขาด) แต้มติดลบ trick ที่ได้เกินเรียกว่า [[overtrick]] ส่วน trick ที่ขาดเรียกว่า [[undertrick]]',
        en: 'Taking **as many tricks or more** than the [[contract]] needs = **made**, a plus score. Fewer = **down**, a minus score. Extra tricks are [[overtrick|overtricks]]; tricks short are [[undertrick|undertricks]].',
      },
    },
    { kind: 'h', text: { th: 'แต้มของ trick ตาม contract', en: 'Points for the contract tricks' } },
    {
      kind: 'p',
      text: {
        th: 'นับเฉพาะ trick เกิน 6 ตามตัวเลขของ contract (ถ้าทำได้):',
        en: 'Only the tricks above 6 that the contract names are counted (if it is made):',
      },
    },
    {
      kind: 'list',
      items: [
        { th: '{C} หรือ {D}: trick ละ 20', en: '{C} or {D}: 20 a trick' },
        { th: '{H} หรือ {S}: trick ละ 30', en: '{H} or {S}: 30 a trick' },
        {
          th: 'NT: trick แรก 40 ที่เหลือ trick ละ 30',
          en: 'NT: 40 for the first trick, 30 for each one after',
        },
      ],
    },
    { kind: 'h', text: { th: 'partscore, game และ slam', en: 'Partscore, game and slam' } },
    {
      kind: 'p',
      text: {
        th: 'ถ้าแต้มส่วนนี้**ถึง 100** เรียกว่า [[game]] ได้โบนัสใหญ่ ถ้าไม่ถึงเรียกว่า [[partscore]] ได้โบนัส 50 contract ที่ต่ำที่สุดที่เป็น game คือ 3NT (40 + 30 + 30 = 100), 4{H} หรือ 4{S} (4 × 30 = 120) และ 5{C} หรือ 5{D} (5 × 20 = 100)',
        en: 'If these points **reach 100**, the contract is a [[game]] and earns a big bonus. Below 100 it is a [[partscore]], with a bonus of 50. The lowest game contracts are 3NT (40 + 30 + 30 = 100), 4{H} or 4{S} (4 × 30 = 120) and 5{C} or 5{D} (5 × 20 = 100).',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'contract ระดับ 6 (ต้องได้ 12 trick) เรียกว่า small [[slam]] ระดับ 7 (ต้องได้ครบ 13) เรียกว่า grand slam ได้โบนัสเพิ่มจาก game อีก',
        en: 'A level 6 contract (12 tricks) is a small [[slam]], and level 7 (all 13) is a grand slam. They earn an extra bonus on top of game.',
      },
    },
    { kind: 'h', text: { th: 'Vulnerable', en: 'Vulnerable' } },
    {
      kind: 'p',
      text: {
        th: '[[vulnerable]] (vul) เป็นสถานะที่ทำให้โบนัสสูงขึ้น แต่ถ้าขาดก็เสียแต้มมากขึ้น ในเกมนี้ตั้งได้ในหน้าตั้งค่า (ไม่มีฝ่ายไหน vul หรือ NS vul)',
        en: '[[vulnerable|Vulnerable]] (vul) is a state that makes the bonuses bigger, but going down costs more too. In this game you set it in Settings (nobody vul, or NS vul).',
      },
    },
    {
      kind: 'list',
      items: [
        { th: 'partscore: +50', en: 'partscore: +50' },
        { th: 'game: +300 (ไม่ vul) / +500 (vul)', en: 'game: +300 (not vul) / +500 (vul)' },
        { th: 'small slam: เพิ่มอีก +500 / +750', en: 'small slam: another +500 / +750' },
        { th: 'grand slam: เพิ่มอีก +1000 / +1500', en: 'grand slam: another +1000 / +1500' },
        {
          th: 'overtrick: trick ละ 20 ใน {C} {D} และ 30 ใน {H} {S} NT',
          en: 'overtricks: 20 a trick in {C} {D}, 30 in {H} {S} NT',
        },
        {
          th: 'ขาด: trick ละ −50 (ไม่ vul) / −100 (vul)',
          en: 'down: −50 a trick (not vul) / −100 (vul)',
        },
      ],
    },
    { kind: 'h', text: { th: 'ตัวอย่าง (ไม่ vul)', en: 'Examples (not vul)' } },
    {
      kind: 'list',
      items: [
        {
          th: '4{S} ได้ 10 trick: 4 × 30 = 120 + game 300 = **420**',
          en: '4{S} with 10 tricks: 4 × 30 = 120 + game 300 = **420**',
        },
        {
          th: '4{S} ได้ 11 trick: 420 + overtrick 30 = **450**',
          en: '4{S} with 11 tricks: 420 + overtrick 30 = **450**',
        },
        {
          th: '2{H} ได้ 8 trick: 2 × 30 = 60 + partscore 50 = **110**',
          en: '2{H} with 8 tricks: 2 × 30 = 60 + partscore 50 = **110**',
        },
        {
          th: '3NT ได้ 7 trick: ขาด 2 trick × 50 = **−100**',
          en: '3NT with 7 tricks: 2 down × 50 = **−100**',
        },
      ],
    },
    {
      kind: 'note',
      text: {
        th: 'เกมนี้ไม่มีการ [[double]] (การท้าให้แต้มเพิ่ม) และหน้าสรุปผลจะบอกแต้มให้เสมอ เป้าหลักของคุณคือ**ทำ contract ให้ได้**',
        en: 'This game has no [[double]] (a call that raises the stakes), and the summary always shows the score. Your main goal is to **make the contract**.',
      },
    },
  ],
};
