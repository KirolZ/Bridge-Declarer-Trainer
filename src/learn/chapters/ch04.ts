// Chapter 4 (SPEC §7.7): contracts — level + strain, tricks needed, where contracts come from.

import type { Chapter } from '../types';

export const CH4: Chapter = {
  n: 4,
  title: 'Contract',
  topic: 'ตัวเลข + ดอก, ต้องได้กี่ trick',
  blocks: [
    {
      kind: 'p',
      text: '[[contract]] (สัญญา) บอก 2 อย่าง: ฝั่งที่สัญญาต้องได้กี่ [[trick]] และดอกไหนเป็น [[trump]] เขียนเป็น**ตัวเลข + ดอก** เช่น 4{S} หรือ 3NT',
    },
    { kind: 'h', text: 'ตัวเลขบอกจำนวน trick' },
    {
      kind: 'p',
      text: 'ตัวเลขข้างหน้า (1 ถึง 7) เรียกว่า [[level]] (ระดับ) คือจำนวน trick ที่ต้องได้**เกิน 6** ต้องได้ทั้งหมด **6 + ตัวเลข** trick จาก 13 trick',
    },
    {
      kind: 'list',
      items: [
        '1NT → 6 + 1 = **7** trick',
        '3NT → 6 + 3 = **9** trick',
        '4{S} → 6 + 4 = **10** trick',
        '6{H} → 6 + 6 = **12** trick',
        '7NT → 6 + 7 = **13** trick (ต้องได้ทุก trick)',
      ],
    },
    { kind: 'h', text: 'ดอกบอก trump' },
    {
      kind: 'p',
      text: 'ส่วนท้ายบอกว่าดอกไหนเป็น trump: 4{S} = {S} เป็น trump, 5{D} = {D} เป็น trump ถ้าเป็น NT แปลว่า**ไม่มี trump** ([[nt|No Trump]])',
    },
    {
      kind: 'note',
      text: 'ตัวอย่าง: 4{S} = ต้องได้ 6 + 4 = **10 trick** โดยมี {S} เป็น trump',
    },
    { kind: 'h', text: 'อีกฝั่งต้องได้กี่ trick' },
    {
      kind: 'p',
      text: 'trick ที่ฝั่งเราไม่ได้ อีกฝั่งได้ไป ใน 4{S} ต้องได้ 10 จึงเสียได้ไม่เกิน 13 − 10 = 3 trick ถ้าอีกฝั่งได้ 4 trick เมื่อไหร่ contract นี้ก็**ไม่สำเร็จ**',
    },
    { kind: 'h', text: 'contract มาจากไหน' },
    {
      kind: 'p',
      text: 'ในเกมจริง ก่อนเล่นไพ่ทั้ง 4 คนจะผลัดกันเสนอ contract แข่งกัน เรียกว่า [[auction|การประมูล]] (auction หรือ bidding) ฝั่งที่เสนอสูงสุดได้ contract นั้นไปเล่น',
    },
    {
      kind: 'note',
      text: '**เกมนี้ข้ามการประมูล** — ระบบแจกไพ่ แล้วเลือก contract ให้ฝั่งคุณ (NS) จากการคำนวณว่าถ้าเล่นดีที่สุดจะได้กี่ trick คุณจึงเริ่มเล่นไพ่ได้ทันที',
    },
  ],
};
