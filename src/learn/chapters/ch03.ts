// Chapter 3 (SPEC §7.7): trumps and no trumps.

import type { Chapter } from '../types';

export const CH3: Chapter = {
  n: 3,
  title: 'Trump และ No Trump',
  topic: 'ดอกที่ชนะทุกดอก, ใช้ได้เมื่อไหร่, NT',
  blocks: [
    {
      kind: 'p',
      text: 'contract ส่วนใหญ่กำหนดให้ดอกหนึ่งเป็น [[trump]] (ไพ่ตัด — ดอกที่ชนะทุกดอกอื่น) ดอกไหนเป็น trump ดูได้จาก contract (บทที่ 4) เช่น contract 4{S} มี {S} เป็น trump',
    },
    { kind: 'h', text: 'ใช้ trump ได้เมื่อไหร่' },
    {
      kind: 'p',
      text: 'กติกา[[follow-suit|ลงตามดอก]]ยังเหมือนเดิม: ถ้ายังมีดอกที่นำ **ต้องลงดอกนั้น** จะลง trump แทนไม่ได้ เมื่อ**ไม่มีดอกที่นำเหลือแล้ว**เท่านั้น จึงลง trump ได้ เรียกว่า [[ruff|ตัด]] (ruff)',
    },
    {
      kind: 'p',
      text: 'trump ใบเดียวชนะทุกใบของดอกอื่น แม้จะเป็น trump ใบเล็กที่สุดเจอกับ A ของดอกอื่นก็ตาม',
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'HK H2 S2 HA',
      trump: 'S',
      caption:
        'trump คือ {S} · West นำ {HK} · East ไม่มี {H} จึงตัดด้วย {S2} — {HA} ใหญ่ที่สุดใน {H} ก็จริง แต่ trump ชนะ East จึงกิน',
    },
    { kind: 'h', text: 'ตัดซ้อน' },
    {
      kind: 'p',
      text: 'ถ้ามีมากกว่าหนึ่งคนตัด **trump ใบที่ใหญ่ที่สุดกิน** การตัดด้วย trump ที่ใหญ่กว่าคนก่อนเรียกว่า[[overruff|ตัดซ้อน]] (overruff)',
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'DK S3 S8 D2',
      trump: 'S',
      caption:
        'trump คือ {S} · West นำ {DK} · North ตัดด้วย {S3} · East ก็ไม่มี {D} เลยตัดซ้อนด้วย {S8} ซึ่งใหญ่กว่า East จึงกิน',
    },
    { kind: 'h', text: 'ไม่บังคับให้ตัด' },
    {
      kind: 'p',
      text: 'เมื่อไม่มีดอกที่นำ จะตัดด้วย trump หรือ[[discard|ทิ้ง]]ดอกอื่นก็ได้ กติกา**ไม่บังคับ**ให้ตัด เลือกตามแผนของคุณ',
    },
    {
      kind: 'p',
      text: 'ถ้ามีคนนำ trump มาเอง ทุกคนต้องลง trump ตาม (ถ้ามี) แล้ว trump ใบใหญ่ที่สุดกิน เหมือนดอกทั่วไป',
    },
    { kind: 'h', text: 'No Trump' },
    {
      kind: 'p',
      text: 'contract บางแบบไม่มี trump เลย เรียกว่า [[nt|NT]] (No Trump) ใน NT ใบที่ใหญ่ที่สุด**ของดอกที่นำ**กินเสมอ คนที่ไม่มีดอกที่นำทำได้แค่ทิ้ง ไม่มีทางกิน',
    },
    {
      kind: 'trick',
      leader: 'W',
      cards: 'HK H2 S2 HA',
      trump: 'NT',
      caption:
        'ไพ่ชุดเดียวกับตัวอย่างแรก แต่เล่น NT: {S2} ของ East เป็นแค่ใบที่ทิ้ง {HA} ของ South จึงกิน',
    },
    {
      kind: 'note',
      text: 'บนโต๊ะเกมนี้ contract จะแสดงอยู่มุมบน เช่น 4{S} (มี {S} เป็น trump) หรือ 3NT (ไม่มี trump)',
    },
  ],
};
