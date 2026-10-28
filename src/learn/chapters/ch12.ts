// Chapter 12 (SPEC §7.7): entries (a card that takes the lead to the other hand) and unblocking
// (high cards from the short hand first).

import type { Chapter } from '../types';

export const CH12: Chapter = {
  n: 12,
  title: 'ทางเข้ามือ (entry) และ unblock',
  topic: 'ใบที่พาไปอีกมือ, เล่นใบสูงจากมือที่สั้นก่อน',
  blocks: [
    {
      kind: 'p',
      text: 'จำกติกาจากบทที่ 5 ได้ไหม: **มือที่กิน trick เป็นคนนำ trick ถัดไป** winner ใน [[dummy]] จะเล่นได้ก็ต่อเมื่อ dummy ได้นำ ถ้า dummy มี winner หลายใบแต่ไม่มีทางให้ dummy ได้นำ winner เหล่านั้นก็ไร้ประโยชน์',
    },
    {
      kind: 'p',
      text: '[[entry]] (ทางเข้ามือ) คือใบที่ทำให้มือหนึ่งได้กิน trick แล้วได้นำต่อ เช่น {SA} ใน North: South นำ {S} ใบเล็ก North กินด้วย {SA} แล้วก็ได้นำ',
    },
    { kind: 'h', text: 'นับ entry' },
    {
      kind: 'list',
      items: [
        'ก่อนเล่น นับว่าต้องไปอีกมือ**กี่ครั้ง** และมี entry พอไหม',
        'อย่าใช้ entry ก่อนจำเป็น — ใช้แล้วกลับไปมือนั้นอีกไม่ได้',
        'ถ้าเลือกได้ว่าจะให้มือไหนกิน trick ให้กินด้วยมือที่มี entry มากกว่า แล้วเก็บ entry ของอีกมือไว้ใช้ทีหลัง',
      ],
    },
    {
      kind: 'deal',
      hands: { N: 'A2..KQJ.', S: 'K43..A.' },
      trump: 'NT',
      caption:
        'ถ้า West นำ {S} มา ให้ South กินด้วย {SK} แล้วเก็บ {SA} ไว้: South เล่น {DA} ก่อน แล้วนำ {S} ไปหา {SA} — North ได้นำ {DK} {DQ} {DJ} ต่อ',
    },
    { kind: 'h', text: 'Unblock: เล่นใบสูงจากมือที่สั้นก่อน' },
    {
      kind: 'p',
      text: 'เมื่อดอกหนึ่งมีใบสูงอยู่ทั้งสองมือ ให้เล่นใบสูงของ**มือที่มีดอกนั้นน้อยกว่า**ก่อน ไม่งั้นใบสูงที่ค้างในมือสั้นจะกิน trick ทั้งที่คุณอยากให้อีกมือได้นำต่อ ดอกนั้นจะ "ติดขัด" (blocked) การเอาใบสูงออกจากมือสั้นก่อนเรียกว่า [[unblock]]',
    },
    {
      kind: 'deal',
      hands: { N: '..K3.', S: '..AQJ2.' },
      trump: 'NT',
      caption:
        'North มี {D} 2 ใบ South มี 4 ใบ: นำ {D2} ไป {DK} ก่อน แล้ว North นำ {D3} กลับไปหา {DA} {DQ} {DJ} · ถ้านำ {DA} ก่อนแล้ว North ลง {D3} {DK} จะกินรอบที่ 2 แล้ว North ไม่มี {D} กลับไปหา South',
    },
    {
      kind: 'note',
      text: 'ถ้านำ {DA} ไปแล้ว ยังแก้ได้: ให้ North ลง {DK} ตาม {DA} ไปเลย (ทิ้งใบใหญ่ของมือสั้นลงไป) แบบนี้ก็คือการ unblock เหมือนกัน',
    },
  ],
};
