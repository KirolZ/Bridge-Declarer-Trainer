// Chapter 12 (SPEC §7.7): entries (a card that takes the lead to the other hand) and unblocking
// (high cards from the short hand first).

import type { Bilingual, Chapter } from '../types';

export const CH12: Chapter<Bilingual> = {
  n: 12,
  title: { th: 'ทางเข้ามือ (entry) และ unblock', en: 'Entries and unblocking' },
  topic: {
    th: 'ใบที่พาไปอีกมือ, เล่นใบสูงจากมือที่สั้นก่อน',
    en: 'Cards that get you to the other hand, high cards from the short hand first',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'จำกติกาจากบทที่ 5 ได้ไหม: **มือที่กิน trick เป็นคนนำ trick ถัดไป** winner ใน [[dummy]] จะเล่นได้ก็ต่อเมื่อ dummy ได้นำ ถ้า dummy มี winner หลายใบแต่ไม่มีทางให้ dummy ได้นำ winner เหล่านั้นก็ไร้ประโยชน์',
        en: 'Remember the rule from chapter 5: **the hand that wins a trick leads to the next one**. Winners in [[dummy]] can only be played when dummy has the lead. If dummy has several winners but no way to get the lead, they are useless.',
      },
    },
    {
      kind: 'p',
      text: {
        th: '[[entry]] (ทางเข้ามือ) คือใบที่ทำให้มือหนึ่งได้กิน trick แล้วได้นำต่อ เช่น {SA} ใน North: South นำ {S} ใบเล็ก North กินด้วย {SA} แล้วก็ได้นำ',
        en: 'An [[entry]] is a card that lets a hand win a trick and so take the lead, such as {SA} in North: South leads a small {S}, North wins with {SA} and has the lead.',
      },
    },
    { kind: 'h', text: { th: 'นับ entry', en: 'Count your entries' } },
    {
      kind: 'list',
      items: [
        {
          th: 'ก่อนเล่น นับว่าต้องไปอีกมือ**กี่ครั้ง** และมี entry พอไหม',
          en: 'Before you play, count **how many times** you must get to the other hand, and whether you have enough entries',
        },
        {
          th: 'อย่าใช้ entry ก่อนจำเป็น — ใช้แล้วกลับไปมือนั้นอีกไม่ได้',
          en: 'Do not use an entry before you need it — once it is gone, you cannot get back to that hand',
        },
        {
          th: 'ถ้าเลือกได้ว่าจะให้มือไหนกิน trick ให้กินด้วยมือที่มี entry มากกว่า แล้วเก็บ entry ของอีกมือไว้ใช้ทีหลัง',
          en: "If you can choose which hand wins a trick, win in the hand with more entries and keep the other hand's entries for later",
        },
      ],
    },
    {
      kind: 'deal',
      hands: { N: 'A2..KQJ.', S: 'K43..A.' },
      trump: 'NT',
      caption: {
        th: 'ถ้า West นำ {S} มา ให้ South กินด้วย {SK} แล้วเก็บ {SA} ไว้: South เล่น {DA} ก่อน แล้วนำ {S} ไปหา {SA} — North ได้นำ {DK} {DQ} {DJ} ต่อ',
        en: "If West leads {S}, win with South's {SK} and keep {SA}: South plays {DA} first, then leads {S} to {SA} — North has the lead to cash {DK} {DQ} {DJ}",
      },
    },
    {
      kind: 'h',
      text: {
        th: 'Unblock: เล่นใบสูงจากมือที่สั้นก่อน',
        en: 'Unblocking: high cards from the short hand first',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'เมื่อดอกหนึ่งมีใบสูงอยู่ทั้งสองมือ ให้เล่นใบสูงของ**มือที่มีดอกนั้นน้อยกว่า**ก่อน ไม่งั้นใบสูงที่ค้างในมือสั้นจะกิน trick ทั้งที่คุณอยากให้อีกมือได้นำต่อ ดอกนั้นจะ "ติดขัด" (blocked) การเอาใบสูงออกจากมือสั้นก่อนเรียกว่า [[unblock]]',
        en: 'When both hands hold high cards in a suit, play the high cards of **the hand with fewer cards in it** first. Otherwise a high card left in the short hand wins a trick when you wanted the other hand to keep the lead, and the suit is "blocked". Getting the high cards out of the short hand first is called an [[unblock]].',
      },
    },
    {
      kind: 'deal',
      hands: { N: '..K3.', S: '..AQJ2.' },
      trump: 'NT',
      caption: {
        th: 'North มี {D} 2 ใบ South มี 4 ใบ: นำ {D2} ไป {DK} ก่อน แล้ว North นำ {D3} กลับไปหา {DA} {DQ} {DJ} · ถ้านำ {DA} ก่อนแล้ว North ลง {D3} {DK} จะกินรอบที่ 2 แล้ว North ไม่มี {D} กลับไปหา South',
        en: 'North has 2 {D}, South has 4: lead {D2} to {DK} first, then North leads {D3} back to {DA} {DQ} {DJ} · lead {DA} first, with North playing {D3}, and {DK} wins the second round with North out of {D} to get back to South',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ถ้านำ {DA} ไปแล้ว ยังแก้ได้: ให้ North ลง {DK} ตาม {DA} ไปเลย (ทิ้งใบใหญ่ของมือสั้นลงไป) แบบนี้ก็คือการ unblock เหมือนกัน',
        en: "If you have already led {DA}, you can still fix it: let North play {DK} under {DA} (throwing the short hand's high card away) — that is an unblock too.",
      },
    },
  ],
};
