// Chapter 10 (SPEC §7.7): the finesse — lead towards the honours, about a 50% chance; in this
// game the bots see every card but cannot move them.

import type { Bilingual, Chapter } from '../types';

export const CH10: Chapter<Bilingual> = {
  n: 10,
  title: { th: 'Finesse', en: 'The finesse' },
  topic: {
    th: 'เล่นเข้าหาใบสูง หวังว่าใบที่ขาดอยู่ทางที่ถูก',
    en: 'Lead towards a high card, hoping the missing card is in the right place',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'บางครั้งคุณมีใบสูงที่เว้นช่อง เช่น {SA} {SQ} แต่ไม่มี {SK} ถ้าเล่น {SA} แล้วตามด้วย {SQ} ตรง ๆ คนที่ถือ {SK} จะกิน {SQ} ทันที [[finesse]] คือวิธีให้ {SQ} กินได้ แม้ {SK} ยังอยู่กับฝั่งป้องกัน',
        en: 'Sometimes your top cards have a gap, such as {SA} {SQ} without {SK}. Play {SA} and then {SQ}, and whoever holds {SK} wins {SQ} at once. A [[finesse]] is a way to make {SQ} win while {SK} is still out with the defenders.',
      },
    },
    { kind: 'h', text: { th: 'นำเข้าหาใบสูง', en: 'Lead towards the high cards' } },
    {
      kind: 'p',
      text: {
        th: 'หลักคือ**นำจากมือตรงข้าม เข้าหา**มือที่มี A Q แล้วดูใบของคนที่ลงก่อนมือนั้น:',
        en: 'The key is to **lead from the opposite hand, towards** the hand with the A Q, and watch the card of the player who plays before that hand:',
      },
    },
    {
      kind: 'deal',
      hands: { N: 'AQ...', E: '765...', S: '432...', W: 'K98...' },
      trump: 'NT',
      caption: {
        th: 'South นำ {S2} · ถ้า West ลงใบเล็ก North ลง {SQ} — West ลงไปแล้ว และ East ไม่มีใบไหนใหญ่กว่า {SQ} · ถ้า West ลง {SK} North ขึ้น {SA} แล้ว {SQ} กลายเป็นใบสูงสุด',
        en: 'South leads {S2} · if West plays low, North plays {SQ} — West has already played, and East has nothing higher than {SQ} · if West plays {SK}, North wins with {SA} and {SQ} becomes the top card',
      },
    },
    {
      kind: 'list',
      items: [
        {
          th: '{SK} อยู่กับ **West** (ลงก่อน North) → finesse สำเร็จ {SA} กับ {SQ} กินได้ทั้งคู่',
          en: '{SK} with **West** (who plays before North) → the finesse works, both {SA} and {SQ} win',
        },
        {
          th: '{SK} อยู่กับ **East** (ลงหลัง North) → East กิน {SQ} finesse ไม่สำเร็จ',
          en: '{SK} with **East** (who plays after North) → East wins {SQ}, the finesse fails',
        },
      ],
    },
    {
      kind: 'p',
      text: {
        th: 'ถ้านำ {SQ} ออกจาก North เอง คนที่มี {SK} จะลงทีหลังเสมอ และรอกินได้ทุกครั้ง — finesse จึงต้องนำ**จากอีกมือ**เท่านั้น',
        en: 'If you lead {SQ} from North itself, the player with {SK} always plays after it and can wait to win it — a finesse must be led **from the other hand**.',
      },
    },
    { kind: 'h', text: { th: 'โอกาสครึ่งต่อครึ่ง', en: 'An even chance' } },
    {
      kind: 'p',
      text: {
        th: 'ในการเล่นจริงคุณไม่เห็นไพ่ของ West กับ East {SK} จะอยู่กับ West หรือ East ก็ได้พอ ๆ กัน finesse จึงสำเร็จราว **50%** ซึ่งดีกว่าเล่น {SA} แล้ว {SQ} ตรง ๆ ที่แทบไม่มีทางได้ (เว้นแต่ {SK} อยู่ใบเดียวแล้วร่วงลงมาเอง)',
        en: "In a real game you cannot see West's and East's cards: {SK} is as likely to be with West as with East, so a finesse works about **50%** of the time. That is far better than playing {SA} and then {SQ}, which almost never works (unless {SK} is single and falls on its own).",
      },
    },
    {
      kind: 'note',
      text: {
        th: 'ในเกมนี้บอทฝั่งป้องกันเห็นไพ่ทุกมือ แต่**ย้ายไพ่ไม่ได้** ถ้า {SK} อยู่กับ West finesse ก็สำเร็จ ถ้าอยู่กับ East ก็ไม่สำเร็จ ไม่ว่าบอทจะรู้หรือไม่ หลังจบมือ หน้าวิเคราะห์จะเปิดให้เห็นว่าใบอยู่ที่ใคร',
        en: 'In this game the defending bots see every card, but **they cannot move them**. If {SK} is with West the finesse works; if it is with East it fails, whatever the bot knows. After the hand, the analysis shows you who held it.',
      },
    },
    { kind: 'h', text: { th: 'นำเข้าหา K', en: 'Leading towards a king' } },
    {
      kind: 'p',
      text: {
        th: 'แบบเดียวกันใช้กับ K ที่ขาด A: {SK} กับใบเล็กใน North — นำใบเล็กจาก South **เข้าหา** {SK} ถ้า {SA} อยู่กับ West (ลงก่อน North) {SK} จะได้ 1 trick ไม่ว่า West จะลงอะไร แต่ถ้านำ {SK} ออกไปเอง {SA} กินแน่นอน',
        en: 'The same works for a king without the ace: {SK} and a small card in North — lead a small card from South **towards** {SK}. If {SA} is with West (who plays before North), {SK} takes a trick whatever West plays. Lead {SK} out yourself and {SA} is sure to win it.',
      },
    },
  ],
};
