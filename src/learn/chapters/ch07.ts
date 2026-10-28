// Chapter 7 (SPEC §7.7): planning before the first card — count winners in NT, losers with trumps.

import type { Chapter } from '../types';

export const CH7: Chapter = {
  n: 7,
  title: 'วางแผนก่อนเล่น',
  topic: 'นับ winner ใน NT, นับ loser เมื่อมี trump',
  blocks: [
    {
      kind: 'p',
      text: 'บทที่ 1–6 คือกติกา ตั้งแต่บทนี้คือ**วิธีเล่นให้ได้ trick มากขึ้น** และเริ่มจากนิสัยที่สำคัญที่สุด: พอ [[dummy]] หงายไพ่แล้ว ให้หยุดดูไพ่ฝั่งคุณทั้งสองมือ แล้ว**นับ**ก่อนลงใบแรก',
    },
    { kind: 'h', text: 'นับ winner (เมื่อเล่น NT)' },
    {
      kind: 'p',
      text: '[[winner]] คือใบที่กิน [[trick]] ได้แน่ทันทีที่เล่น โดยไม่ต้องเสีย trick ให้ใครก่อน ใน [[nt|NT]] ให้นับ winner ทีละดอก โดยดู**สองมือรวมกัน** (South กับ North) นับใบสูงที่เรียงจาก A ลงมาไม่ขาดช่อง',
    },
    {
      kind: 'deal',
      hands: { N: 'AK4.753.KQ2.J654', S: '762.AK2.A53.KQT3' },
      trump: 'NT',
      caption: 'contract 3NT (ต้องได้ 9 trick) — ไพ่ของ North (dummy) กับ South (คุณ)',
    },
    {
      kind: 'list',
      items: [
        '{S}: {SA} {SK} = 2 winner',
        '{H}: {HA} {HK} = 2 winner',
        '{D}: {DA} {DK} {DQ} = 3 winner',
        '{C}: ไม่มี {CA} จึงยังไม่มี winner เลย',
        'รวม **7** ขาดอีก 2 trick',
      ],
    },
    {
      kind: 'p',
      text: 'ขาด 2 trick จะหาจากไหน? {C} มี {CK} {CQ} {CJ} {CT} ถ้ายอมเสีย {CA} ให้ฝั่งป้องกันไปก่อน 1 trick ใบที่เหลือจะกลายเป็น winner 3 ใบ (บทที่ 11) แผนจึงเป็น: เล่น {C} **ก่อน** ขณะที่ยังมี A K ของดอกอื่นไว้กันอยู่',
    },
    {
      kind: 'note',
      text: 'winner ของดอกหนึ่งได้ไม่เกินจำนวนใบของมือที่มีดอกนั้นมากกว่า เช่น {SA} {SK} ใน North กับ {SQ} ใบเดียวใน South: มี A K Q ครบ แต่ได้แค่ 2 trick เพราะมือที่ยาวกว่า (North) มี {S} แค่ 2 ใบ — {SQ} ต้องลงพร้อม {SA} หรือ {SK} ใน trick เดียวกัน',
    },
    { kind: 'h', text: 'นับ loser (เมื่อมี trump)' },
    {
      kind: 'p',
      text: 'เมื่อมี [[trump]] ให้นับอีกแบบ: นับ [[loser]] (ใบที่จะเสีย trick ให้ฝั่งป้องกัน) จากมือ South ซึ่งมี trump ยาวกว่า ทีละดอก แล้วดูว่า North ช่วยปิด loser ไหนได้บ้าง ถ้า loser **มากกว่า**ที่ contract ยอมให้เสีย ต้องหาทางกำจัดก่อนเสียการนำ',
    },
    {
      kind: 'deal',
      hands: { N: 'T43.A752.65.A953', S: 'AKQJ5.64.AK3.872' },
      trump: 'S',
      caption: 'contract 4{S} (ต้องได้ 10 trick เสียได้ 3) — นับ loser จากมือ South',
    },
    {
      kind: 'list',
      items: [
        '{S}: มี A K Q J = 0 loser',
        '{H}: {H6} {H4} — {HA} ของ North กินรอบแรกได้ รอบที่ 2 เสีย = 1 loser',
        '{D}: {DA} {DK} กินได้ {D3} เสีย = 1 loser',
        '{C}: {C8} {C7} {C2} — {CA} ของ North กินได้ 1 รอบ = 2 loser',
        'รวม **4** มากกว่าที่เสียได้ 1',
      ],
    },
    {
      kind: 'p',
      text: 'ทางออก: North มี {D} แค่ 2 ใบ หลัง {DA} {DK} North จะหมด {D} แล้วนำ {D3} ให้ North [[ruff|ตัด]]ด้วย trump ได้ (บทที่ 9) loser เหลือ 3 พอดี',
    },
    { kind: 'h', text: 'ทางกำจัด loser' },
    {
      kind: 'list',
      items: [
        '[[discard|ทิ้ง]] loser บน winner ของอีกมือที่เกินมา — เมื่ออีกมือยังมีดอกนั้น แต่มือคุณหมดแล้ว',
        '[[ruff|ตัด]] loser ด้วย trump ของ dummy (บทที่ 9)',
        'ทำให้ใบในดอกยาวกลายเป็น winner (บทที่ 11) หรือ [[finesse]] (เล่นลอดใบ — บทที่ 10)',
      ],
    },
    {
      kind: 'note',
      text: 'ทำแบบนี้ทุกมือก่อนลงใบแรก ใช้เวลาไม่ถึงนาที ถ้าไม่แน่ใจว่านับถูกไหม กด "คำใบ้" ในเกมแล้วดูว่ายังทำได้กี่ trick',
    },
  ],
};
