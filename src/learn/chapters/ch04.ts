// Chapter 4 (SPEC §7.7): contracts — level + strain, tricks needed, where contracts come from.

import type { Bilingual, Chapter } from '../types';

export const CH4: Chapter<Bilingual> = {
  n: 4,
  title: { th: 'Contract', en: 'The contract' },
  topic: {
    th: 'ตัวเลข + ดอก, ต้องได้กี่ trick',
    en: 'A number + a suit, how many tricks you need',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: '[[contract]] (สัญญา) บอก 2 อย่าง: ฝั่งที่สัญญาต้องได้กี่ [[trick]] และดอกไหนเป็น [[trump]] เขียนเป็น**ตัวเลข + ดอก** เช่น 4{S} หรือ 3NT',
        en: 'A [[contract]] says two things: how many [[trick|tricks]] the side that made it must take, and which suit is [[trump|trumps]]. It is written as **a number + a suit**, such as 4{S} or 3NT.',
      },
    },
    { kind: 'h', text: { th: 'ตัวเลขบอกจำนวน trick', en: 'The number is the tricks' } },
    {
      kind: 'p',
      text: {
        th: 'ตัวเลขข้างหน้า (1 ถึง 7) เรียกว่า [[level]] (ระดับ) คือจำนวน trick ที่ต้องได้**เกิน 6** ต้องได้ทั้งหมด **6 + ตัวเลข** trick จาก 13 trick',
        en: 'The number in front (1 to 7) is the [[level]]: how many tricks you need **above 6**. You need **6 + the number** of the 13 tricks.',
      },
    },
    {
      kind: 'list',
      items: [
        { th: '1NT → 6 + 1 = **7** trick', en: '1NT → 6 + 1 = **7** tricks' },
        { th: '3NT → 6 + 3 = **9** trick', en: '3NT → 6 + 3 = **9** tricks' },
        { th: '4{S} → 6 + 4 = **10** trick', en: '4{S} → 6 + 4 = **10** tricks' },
        { th: '6{H} → 6 + 6 = **12** trick', en: '6{H} → 6 + 6 = **12** tricks' },
        {
          th: '7NT → 6 + 7 = **13** trick (ต้องได้ทุก trick)',
          en: '7NT → 6 + 7 = **13** tricks (every trick)',
        },
      ],
    },
    { kind: 'h', text: { th: 'ดอกบอก trump', en: 'The suit is trumps' } },
    {
      kind: 'p',
      text: {
        th: 'ส่วนท้ายบอกว่าดอกไหนเป็น trump: 4{S} = {S} เป็น trump, 5{D} = {D} เป็น trump ถ้าเป็น NT แปลว่า**ไม่มี trump** ([[nt|No Trump]])',
        en: 'The end says which suit is trumps: 4{S} = {S} are trumps, 5{D} = {D} are trumps. NT means **no trumps** ([[nt|No Trump]]).',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ตัวอย่าง: 4{S} = ต้องได้ 6 + 4 = **10 trick** โดยมี {S} เป็น trump',
        en: 'For example: 4{S} = you need 6 + 4 = **10 tricks**, with {S} as trumps.',
      },
    },
    {
      kind: 'h',
      text: { th: 'อีกฝั่งต้องได้กี่ trick', en: 'How many tricks the other side needs' },
    },
    {
      kind: 'p',
      text: {
        th: 'trick ที่ฝั่งเราไม่ได้ อีกฝั่งได้ไป ใน 4{S} ต้องได้ 10 จึงเสียได้ไม่เกิน 13 − 10 = 3 trick ถ้าอีกฝั่งได้ 4 trick เมื่อไหร่ contract นี้ก็**ไม่สำเร็จ**',
        en: 'Every trick your side does not take goes to the other side. In 4{S} you need 10, so you can lose at most 13 − 10 = 3 tricks. As soon as the other side takes 4 tricks, the contract **fails**.',
      },
    },
    { kind: 'h', text: { th: 'contract มาจากไหน', en: 'Where the contract comes from' } },
    {
      kind: 'p',
      text: {
        th: 'ในเกมจริง ก่อนเล่นไพ่ทั้ง 4 คนจะผลัดกันเสนอ contract แข่งกัน เรียกว่า [[auction|การประมูล]] (auction หรือ bidding) ฝั่งที่เสนอสูงสุดได้ contract นั้นไปเล่น',
        en: 'In a real game, before any card is played, the 4 players take turns offering contracts against each other. This is the [[auction]] (or bidding). The side that offers the highest contract gets to play it.',
      },
    },
    {
      kind: 'note',
      text: {
        th: '**เกมนี้ข้ามการประมูล** — ระบบแจกไพ่ แล้วเลือก contract ให้ฝั่งคุณ (NS) จากการคำนวณว่าถ้าเล่นดีที่สุดจะได้กี่ trick คุณจึงเริ่มเล่นไพ่ได้ทันที',
        en: '**This game skips the auction** — it deals the cards and picks a contract for your side (NS) from a count of how many tricks best play makes, so you can start playing at once.',
      },
    },
  ],
};
