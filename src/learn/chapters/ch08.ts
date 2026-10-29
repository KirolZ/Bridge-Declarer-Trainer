// Chapter 8 (SPEC §7.7): drawing trumps — when to, and when not yet.

import type { Bilingual, Chapter } from '../types';

export const CH8: Chapter<Bilingual> = {
  n: 8,
  title: { th: 'ดึง trump', en: 'Drawing trumps' },
  topic: { th: 'เมื่อไหร่ควรดึง และเมื่อไหร่ไม่ควร', en: 'When to draw them, and when not to' },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'ฝั่งป้องกันก็มี [[trump]] ได้ ถ้าปล่อยไว้ พอเขาหมดดอกที่คุณนำ เขาจะ[[ruff|ตัด]] [[winner]] ของคุณ — A ที่ควรกินกลับเสียไป',
        en: 'The defenders can hold [[trump|trumps]] too. Leave them, and when they run out of a suit you lead, they will [[ruff]] your [[winner|winners]] — an ace that should win is lost.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'วิธีกันคือ [[draw-trumps|ดึง trump]]: นำ trump ออกไปหลายรอบจนฝั่งป้องกันไม่มี trump เหลือ หลังจากนั้น winner ดอกอื่นของคุณจะปลอดภัย',
        en: 'The cure is to [[draw-trumps|draw trumps]]: lead trumps for several rounds until the defenders have none left. After that, your winners in the other suits are safe.',
      },
    },
    {
      kind: 'deal',
      hands: { N: '84.T97.AKQ5.6432', S: 'A73.AKQJ3.642.K5' },
      trump: 'H',
      caption: {
        th: 'trump คือ {H} · ฝั่งคุณมี {H} 5 + 3 = 8 ใบ ฝั่งป้องกันมีอีก 5 ใบ — ถ้าเล่น {D} ก่อน คนที่หมด {D} จะตัดได้ จึงดึง trump ({HA} {HK} {HQ} …) จนฝั่งป้องกันหมดก่อน แล้วค่อยเล่น {D}',
        en: 'Trumps are {H} · your side has 5 + 3 = 8 {H}, the defenders the other 5 — play {D} first and whoever runs out of {D} can ruff, so draw trumps ({HA} {HK} {HQ} …) until the defenders have none, then play {D}',
      },
    },
    { kind: 'h', text: { th: 'นับ trump ของฝั่งป้องกัน', en: "Count the defenders' trumps" } },
    {
      kind: 'p',
      text: {
        th: 'ดอกหนึ่งมี 13 ใบ ฝั่งป้องกันจึงมี trump = 13 − trump ของคุณสองมือรวมกัน ทุกรอบที่ดึง ให้ดูว่า West กับ East ลง trump ตามกี่ใบ แล้วลบออก **หยุดเมื่อเขาหมด** ไม่ต้องดึง trump ที่เหลืออยู่แค่ในมือคุณเอง',
        en: 'A suit has 13 cards, so the defenders hold 13 minus the trumps in your two hands. Each round you draw, see how many trumps West and East play and take them off. **Stop when they have none** — there is no need to draw trumps that are only left in your own hands.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ถ้าคนไหนไม่ลง trump ตาม (ทิ้งดอกอื่นแทน) แปลว่าเขาหมด trump แล้ว trump ที่ยังขาดอยู่ทั้งหมดอยู่กับอีกคน',
        en: 'If a player does not follow with a trump (and discards instead), that player has no trumps left, and all the missing trumps are with the other one.',
      },
    },
    { kind: 'h', text: { th: 'เมื่อไหร่ยังไม่ควรดึง', en: 'When not to draw trumps yet' } },
    {
      kind: 'list',
      items: [
        {
          th: 'เมื่อต้องใช้ trump ของ [[dummy]] ตัด [[loser]] (บทที่ 9) — ถ้าดึงก่อน dummy ต้องลง trump ตามจนไม่เหลือไว้ตัด',
          en: "When you need [[dummy|dummy's]] trumps to ruff [[loser|losers]] (chapter 9) — draw first and dummy has to follow with its trumps until none are left to ruff with",
        },
        {
          th: 'เมื่อ trump ที่ฝั่งป้องกันเหลือคือ**ใบใหญ่ที่สุด** (เช่น A) ซึ่งต้องเสียให้อยู่แล้ว และคุณมี loser ที่ทิ้งได้ก่อน — ถ้าดึงตอนนี้ เขาได้นำแล้วกิน loser ของคุณทันที ให้ทิ้ง loser บน winner ของ dummy ก่อน',
          en: "When the defenders' last trump is **the highest** (say the ace), which you must lose anyway, and you have a loser to discard first — draw now and they win the lead and cash your loser at once; discard the loser on dummy's winner first",
        },
        {
          th: 'เมื่อฝั่งป้องกันไม่มี trump เหลือแล้ว — ดึงต่อก็เสียเวลา',
          en: 'When the defenders have no trumps left — drawing more wastes time',
        },
      ],
    },
    {
      kind: 'note',
      text: {
        th: 'กฎง่าย ๆ: ดึง trump ก่อน**เว้นแต่**มีเหตุผลชัด ๆ ว่ายังไม่ควร ถามตัวเองทุกครั้งว่า "ถ้าดึงตอนนี้ จะเสียอะไรไหม?"',
        en: 'A simple rule: draw trumps first **unless** there is a clear reason not to yet. Ask yourself every time: "If I draw trumps now, what could I lose?".',
      },
    },
  ],
};
