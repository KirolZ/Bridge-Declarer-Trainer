// Chapter 9 (SPEC §7.7): ruffing losers in dummy, the hand with fewer trumps.

import type { Chapter } from '../types';

export const CH9: Chapter = {
  n: 9,
  title: 'ตัดใน dummy (ruff)',
  topic: 'ใช้ trump ฝั่งที่สั้นกว่ากินดอกที่หมด',
  blocks: [
    {
      kind: 'p',
      text: 'การ[[ruff|ตัด]]ไม่ได้มีไว้ให้ฝั่งป้องกันใช้อย่างเดียว ถ้า [[dummy]] หมดดอกที่ South ยังมี [[loser]] อยู่ ให้นำ loser นั้นจาก South แล้วให้ dummy ตัดด้วย [[trump]] — loser กลายเป็น trick ของคุณ',
    },
    {
      kind: 'deal',
      hands: { N: '963.8.87654.AK74', S: 'AKQJ5.A74.AK2.32' },
      trump: 'S',
      caption:
        'trump คือ {S} · South มี {H} loser 2 ใบ ({H7} {H4}) แต่ North มี {H} ใบเดียว: เล่น {HA} (North ลง {H8}) แล้วนำ {H} ให้ North ตัด 2 ครั้ง',
    },
    { kind: 'h', text: 'ตัดในมือที่ trump สั้นกว่า' },
    {
      kind: 'p',
      text: 'ตัดใน**มือที่มี trump น้อยกว่า** (ปกติคือ dummy) จึงได้ trick เพิ่ม ในตัวอย่าง trump 5 ใบของ South กินได้ 5 trick อยู่แล้วตอนดึง trump แต่ trump 3 ใบของ North ปกติไม่ได้ trick เลย เพราะต้องลงตาม trump ของ South — ถ้าใช้ตัด {H} ก็ได้ trick เพิ่มทุกครั้ง',
    },
    {
      kind: 'p',
      text: 'ในทางกลับกัน ให้ South ตัดดอกที่ North นำมาไม่ได้เพิ่ม trick: trump ใบนั้นของ South กินได้อยู่แล้ว แค่กินคนละรอบ',
    },
    { kind: 'h', text: 'ตัดก่อน แล้วค่อยดึง trump' },
    {
      kind: 'p',
      text: 'trump ของ dummy ใช้ตัดได้ก็ต่อเมื่อยังอยู่ ถ้า[[draw-trumps|ดึง trump]]ก่อน dummy ต้องลง trump ตามจนหมด (บทที่ 8) จึงต้อง**ตัด loser ก่อน** แล้วค่อยดึง trump ที่เหลือ',
    },
    {
      kind: 'p',
      text: 'ถ้าต้องตัดหลายครั้ง ต้องกลับมาที่ South ระหว่างแต่ละครั้งเพื่อนำ loser ใบถัดไป — วางแผนไว้ก่อนว่าจะกลับมาด้วยใบไหน',
    },
    { kind: 'h', text: 'ระวังการตัดซ้อน' },
    {
      kind: 'p',
      text: 'ถ้าคนที่ลง**หลัง** dummy หมดดอกนั้นเหมือนกันและมี trump ใหญ่กว่า เขาจะตัดซ้อนได้ ถ้า dummy มี trump ใบใหญ่ ให้ตัดด้วยใบใหญ่',
    },
    {
      kind: 'trick',
      leader: 'S',
      cards: 'H2 H5 SK D3',
      trump: 'S',
      caption:
        'trump คือ {S} · South นำ {H2} · North ตัดด้วย {SK} ถ้าตัดด้วยใบเล็ก East ซึ่งหมด {H} และมี {SJ} จะตัดซ้อนได้ — ตัดด้วย {SK} North จึงกิน',
    },
  ],
};
