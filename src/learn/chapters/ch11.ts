// Chapter 11 (SPEC §7.7): establishing a long suit — how many tricks to lose first, starting early
// while the other suits are still stopped, ducking to keep a way across.

import type { Bilingual, Chapter } from '../types';

export const CH11: Chapter<Bilingual> = {
  n: 11,
  title: { th: 'สร้างดอกยาวให้กินได้', en: 'Setting up a long suit' },
  topic: {
    th: 'establish long suit, ต้องเสียกี่ trick ก่อน',
    en: 'Establishing a long suit, how many tricks you lose first',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'ใบเล็กก็กิน [[trick]] ได้ ถ้าฝั่งป้องกันหมดดอกนั้นแล้ว เช่น {D} 5 ใบใน [[dummy]]: เล่นไปหลายรอบจนฝั่งป้องกันไม่มี {D} เหลือ {D} ใบเล็กที่เหลือก็กินได้ทุกใบ การทำให้ [[long-suit|ดอกยาว]] กินได้แบบนี้เรียกว่า [[establish]]',
        en: 'Small cards win [[trick|tricks]] too once the defenders have run out of the suit. For example, 5 {D} in [[dummy]]: play the suit until the defenders have no {D} left, and every small {D} still there wins. Making a [[long-suit|long suit]] win like this is to [[establish]] it.',
      },
    },
    { kind: 'h', text: { th: 'ต้องเสียกี่ trick ก่อน', en: 'How many tricks you lose first' } },
    {
      kind: 'p',
      text: {
        th: 'นับว่าใบสูงลำดับ A K Q … ที่อยู่เหนือใบของคุณ อยู่กับฝั่งป้องกันกี่ใบ แต่ละใบต้องเสียให้ 1 trick ก่อน เช่น มี K Q J ขาด A → เสีย 1 trick, มี Q J 10 ขาด A K → เสีย 2 trick',
        en: 'Count how many of the top cards (A K Q …) above yours the defenders hold. Each one costs a trick first. With K Q J and no ace → lose 1 trick; with Q J 10 and no A K → lose 2 tricks.',
      },
    },
    {
      kind: 'deal',
      hands: { N: '..KQJ32.', S: '..54.' },
      trump: 'NT',
      caption: {
        th: '{D} ขาดแค่ {DA} → ต้องเสีย 1 trick ให้ {DA} แล้ว {DK} {DQ} {DJ} กลายเป็น [[winner]] · ฝั่งป้องกันมี {D} 13 − 7 = 6 ใบ ถ้าแบ่งกัน 3–3 พอเล่นครบ 3 รอบเขาจะหมด แล้ว {D3} {D2} ก็กินได้ด้วย',
        en: '{D} is missing only {DA} → lose 1 trick to {DA}, then {DK} {DQ} {DJ} become [[winner|winners]] · the defenders hold 13 − 7 = 6 {D}; if they split 3–3 they run out after 3 rounds, and {D3} {D2} win too',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'นับให้ครบสองอย่าง: ต้อง**เสียกี่ trick** (ใบสูงที่ขาด) และต้อง**เล่นกี่รอบ**กว่าฝั่งป้องกันจะหมดดอกนั้น (ดูจากจำนวนใบที่เขามี)',
        en: 'Count both things: how many **tricks you must lose** (the missing top cards) and how many **rounds you must play** before the defenders run out of the suit (from how many cards they hold).',
      },
    },
    {
      kind: 'h',
      text: {
        th: 'เริ่มให้เร็ว ตอนที่ยังมีใบกั้น',
        en: 'Start early, while you still have stoppers',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ทุกครั้งที่เสีย trick ฝั่งป้องกันได้นำ และจะเล่นดอกที่เขากินได้ ถ้าคุณยังมี A ของดอกนั้นอยู่ เขาทำอะไรไม่ได้ — ใบที่กันแบบนี้เรียกว่า [[stopper]] (ใบกั้น) ถ้าใช้ stopper ไปก่อน พอเขาได้นำ เขาจะกินดอกนั้นได้หลาย trick',
        en: 'Every time you lose a trick the defenders get the lead, and they will play a suit they can win. If you still hold the ace of that suit, they can do nothing — a card that guards a suit like this is a [[stopper]]. Use up your stopper first, and when they get the lead they can run that suit for several tricks.',
      },
    },
    {
      kind: 'note',
      text: {
        th: 'จึงเล่นดอกยาว**ก่อน** แล้วเก็บ A ของดอกอื่นไว้ เมื่อดอกยาวกินได้แล้วค่อยเก็บ winner ที่เหลือ',
        en: 'So play the long suit **first** and keep the aces of the other suits. Once the long suit is set up, cash the rest of your winners.',
      },
    },
    { kind: 'h', text: { th: 'ยอมเสียรอบแรก (duck)', en: 'Give up the first round (duck)' } },
    {
      kind: 'p',
      text: {
        th: 'ถ้าดอกยาวอยู่ใน dummy ที่ไม่มีใบดอกอื่นพาไปหา และ South มีดอกนั้นน้อย บางทีต้อง [[duck]] — ลงใบเล็กทั้งสองมือ ยอมเสียรอบแรก เพื่อให้ South ยังเหลือใบดอกนั้นไว้นำไปหา dummy ในรอบต่อไป',
        en: 'If the long suit is in a dummy with no other way in, and South is short in it, you may need to [[duck]] — play small from both hands and give up the first round, so that South still has a card of the suit to lead to dummy on the next round.',
      },
    },
    {
      kind: 'deal',
      hands: { N: '..AK432.', S: '..65.' },
      trump: 'NT',
      caption: {
        th: 'ฝั่งป้องกันมี {D} 6 ใบ ต้องเล่น 3 รอบ และเสีย 1 รอบ ถ้าเล่น {DA} {DK} ก่อน รอบที่ 3 ต้องเสีย แล้ว South ไม่มี {D} พาไปหา dummy อีก · ให้เสียรอบแรก (South {D5} North {D2}) แล้ว {D6} ของ South จะพาไปหา {DA} {DK} {D4} {D3}',
        en: "The defenders hold 6 {D}: it takes 3 rounds, one of them lost. Play {DA} {DK} first and the third round is lost with South out of {D}, no way back to dummy · lose the first round instead (South {D5}, North {D2}), and South's {D6} leads to {DA} {DK} {D4} {D3}",
      },
    },
  ],
};
