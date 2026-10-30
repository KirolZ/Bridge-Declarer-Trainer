// Chapter 14 (SPEC §7.7): how to practise with this game — hint, undo, claim, the review, study
// mode, beginner mode — and, said plainly, that the bots see every hand.

import type { Bilingual, Chapter } from '../types';

export const CH14: Chapter<Bilingual> = {
  n: 14,
  title: { th: 'ใช้เกมนี้ฝึกยังไง', en: 'How to practise with this game' },
  topic: {
    th: 'คำใบ้, ย้อน, Claim, หน้าวิเคราะห์, โหมดศึกษา',
    en: 'Hints, undo, claim, the analysis, study mode',
  },
  blocks: [
    {
      kind: 'p',
      text: {
        th: 'ในเกมนี้คุณฝึกเป็น [[declarer]] อย่างเดียว: ระบบแจกไพ่และเลือก [[contract]] ให้ คุณเล่นทั้ง South และ [[dummy]] ส่วน West กับ East เป็นบอท บทนี้อธิบายเครื่องมือที่ช่วยให้ฝึกได้เร็วขึ้น',
        en: 'In this game you practise only as [[declarer]]: the game deals and picks the [[contract]], you play both South and [[dummy]], and West and East are bots. This chapter explains the tools that help you learn faster.',
      },
    },
    { kind: 'h', text: { th: 'บอทเห็นไพ่ทุกมือ', en: 'The bots see every card' } },
    {
      kind: 'p',
      text: {
        th: 'ต้องรู้ก่อนอย่างหนึ่ง: **บอทฝั่งป้องกันเห็นไพ่ทุกใบ** ทั้งมือคุณ มือ dummy และมือของกันและกัน แล้วเลือกใบที่ดีที่สุดเสมอ การเล่นแบบเห็นไพ่ทั้ง 4 มือนี้เรียกว่า [[double-dummy]] บอทจึงป้องกันได้แม่นกว่าคนจริงมาก',
        en: "One thing to know first: **the defending bots see every card** — your hand, dummy and each other's — and always choose the best one. Playing with all 4 hands in view like this is called [[double-dummy]], so the bots defend far more accurately than real people.",
      },
    },
    {
      kind: 'list',
      items: [
        {
          th: 'บอทไม่เคยพลาด และไม่หลงกล — ทางเล่นที่หวังให้คนจริงเดาผิด ใช้กับบอทไม่ได้',
          en: 'The bots never slip and are never fooled — a play that hopes a real player guesses wrong does not work against them',
        },
        {
          th: 'แต่บอทย้ายไพ่ไม่ได้: ถ้าไพ่วางอยู่ให้ [[finesse]] ได้ ก็ได้เสมอ ถ้าวางไม่ดี ก็ไม่ได้เสมอ (บทที่ 10)',
          en: 'But the bots cannot move the cards: if a [[finesse]] is on, it always works; if it is not, it never does (chapter 10)',
        },
        {
          th: 'ทุกมือที่แจก ระบบเลือก contract ที่**ทำได้จริงถ้าเล่นถูกทุกใบ** ไม่มีมือที่เป็นไปไม่ได้',
          en: 'For every deal, the game picks a contract that **can really be made if every card is right** — there are no impossible hands',
        },
      ],
    },
    {
      kind: 'note',
      text: {
        th: 'ถ้าไปเล่นกับคนจริงแล้วรู้สึกว่าง่ายกว่าในเกมนี้ เป็นเรื่องปกติ — คนจริงพลาดได้ บอทไม่พลาด',
        en: 'If you play against real people and find it easier than this game, that is normal — people make mistakes, the bots do not.',
      },
    },
    { kind: 'h', text: { th: 'คำใบ้', en: 'Hints' } },
    {
      kind: 'p',
      text: {
        th: 'กดปุ่ม **คำใบ้** (หรือกดปุ่ม H บนคีย์บอร์ด) ตอนถึงตาคุณ เกมจะยกใบที่ดีที่สุดขึ้น (อาจมีหลายใบที่ดีเท่ากัน) และบอกว่าถ้าลงใบนั้นแล้วเล่นดีต่อไปจะได้รวมกี่ [[trick]] จำนวนครั้งที่ใช้คำใบ้แสดงในหน้าสรุปผล',
        en: 'Press **Hint** (or the H key) on your turn and the game raises the best card (there may be several equally good ones) and says how many [[trick|tricks]] you will take in all if you play it and keep playing well. The number of hints you used is shown on the summary.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'วิธีใช้ที่ดี: คิดเองก่อนว่าจะลงใบไหน แล้วค่อยกดคำใบ้เพื่อเช็ก จะได้ฝึกมากกว่ากดทุกตา',
        en: 'A good way to use it: decide on your card first, then press Hint to check — you learn more than by pressing it every turn.',
      },
    },
    { kind: 'h', text: { th: 'ย้อน และเล่นใหม่', en: 'Undo and play again' } },
    {
      kind: 'list',
      items: [
        {
          th: '**ย้อน** (ปุ่ม U, มีเฉพาะ**โหมดมือใหม่**): เอาใบล่าสุดของคุณกลับมา พร้อมใบของบอทที่ลงตามหลัง ย้อนได้ไม่จำกัด',
          en: "**Undo** (the U key, in **beginner mode** only): takes back your last card, and the bots' cards played after it. Undo as often as you like",
        },
        {
          th: '**เล่นมือนี้ใหม่** (ในเมนู): เริ่มมือเดิมตั้งแต่ [[opening-lead|ใบนำแรก]] บอทเล่นเหมือนเดิมทุกครั้งถ้าคุณเล่นเหมือนเดิม จึงลองแผนอื่นกับไพ่ชุดเดิมได้',
          en: '**Play this hand again** (in the menu): starts the same hand from the [[opening-lead]]. The bots play the same way every time if you do, so you can try another plan with the same cards',
        },
        {
          th: '**แจกไพ่ใหม่** (ในเมนู และในหน้าสรุปผล): แจกไพ่ชุดใหม่ตามตั้งค่า',
          en: '**New deal** (in the menu and on the summary): deals new cards, following your settings',
        },
      ],
    },
    {
      kind: 'p',
      text: {
        th: 'กลัวกดผิดใบ? ในหน้าตั้งค่า เลือก**การลงไพ่**แบบ "แตะเลือก แล้วยืนยัน" แตะแรกไพ่จะแค่ไปรอกลางโต๊ะ ไพ่ลงจริงเมื่อแตะไพ่ใบนั้นกลางโต๊ะ หรือแตะใบเดิมในมืออีกครั้ง ถ้าเปลี่ยนใจ แตะที่อื่นบนโต๊ะเพื่อยกเลิก',
        en: 'Worried about tapping the wrong card? In Settings, set **Playing a card** to "Tap, then confirm". The first tap only sends the card to wait in the middle of the table; it is played when you tap it there, or tap the same card in your hand again. Changed your mind? Tap elsewhere on the table to cancel.',
      },
    },
    { kind: 'h', text: { th: 'Claim', en: 'Claim' } },
    {
      kind: 'p',
      text: {
        th: 'ถ้าเห็นว่า trick ที่เหลือได้แน่แล้ว ไม่ต้องเล่นต่อทีละใบ กด [[claim|Claim]] แล้วบอกว่าจะได้อีกกี่ trick เกมจะตรวจว่าถ้าฝั่งป้องกันเล่นดีที่สุดแล้วคุณยังได้ตามนั้นไหม ถ้าได้ มือจบทันที ถ้าไม่ได้ เกมบอกว่า "ฝั่งป้องกันยังมีทางกิน" แล้วให้เล่นต่อจากเดิม ไม่เสียอะไร',
        en: 'When you can see that the remaining tricks are yours, there is no need to play them out card by card: press [[claim|Claim]] and say how many more tricks you will take. The game checks that you still get them against the best defence. If you do, the hand ends at once; if not, it says "the defenders can still take tricks" and you carry on from where you were, with nothing lost.',
      },
    },
    { kind: 'h', text: { th: 'หน้าสรุปผล', en: 'The summary' } },
    {
      kind: 'p',
      text: {
        th: 'จบมือแล้ว เกมบอกว่าทำ contract ได้ไหม ได้กี่แต้ม (บทที่ 6) และเทียบกับ double-dummy เช่น "ได้ 9 trick (DD ทำได้ 10)" คือถ้าเล่นถูกทุกใบจะได้ 10',
        en: 'At the end of the hand the game says whether you made the contract, your score (chapter 6), and how you did against double-dummy: "Took 9 tricks (DD makes 10)" means that with every card right you would have taken 10.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ใต้นั้นคือรายการ**จุดที่เสีย trick**: trick ที่เท่าไหร่ คุณลงใบไหน และควรลงใบไหน กดรายการเพื่อ**ดูย้อนหลัง** เห็นไพ่ทั้ง 4 มือทีละ trick และกด "ลองเล่นใหม่จากตรงนี้" เพื่อเล่นจุดนั้นใหม่ได้',
        en: 'Below that is the list of **where tricks were lost**: which trick, the card you played and the card to play instead. Tap an item to **replay** it, with all 4 hands shown trick by trick, and press "Play again from here" to try that point again.',
      },
    },
    {
      kind: 'note',
      text: {
        th: '"เสีย 0 trick" แปลว่าคุณเล่นได้ดีเท่ากับคนที่เห็นไพ่ทุกใบ — เป้าที่ดีที่สุดของแต่ละมือ',
        en: '"No tricks lost" means you played as well as someone who could see every card — the best you can do on any hand.',
      },
    },
    { kind: 'h', text: { th: 'โหมดศึกษา', en: 'Study mode' } },
    {
      kind: 'p',
      text: {
        th: 'เปิดได้ใน**เมนู**บนโต๊ะ หรือหน้าตั้งค่า แล้วจะเห็นไพ่ของ West และ East ระหว่างเล่น ใช้ดูว่าทำไมแผนได้ผลหรือไม่ได้ผล มือที่เปิดโหมดนี้ไม่นับในสถิติ',
        en: "Turn it on from the **menu** on the table or in Settings, and you see West's and East's cards while you play. Use it to see why a plan worked or failed. Hands with this mode on do not count for the stats.",
      },
    },
    { kind: 'h', text: { th: 'โหมดมือใหม่ และปุ่ม ?', en: 'Beginner mode and the ? button' } },
    {
      kind: 'p',
      text: {
        th: '**โหมดมือใหม่** (เปิด / ปิดในหน้าตั้งค่า) ได้ contract ที่มีเผื่อ 1 trick และไม่มี [[slam]] บอทเล่นช้าลง กดใบที่ลงไม่ได้แล้วบอกเหตุผล มีข้อความแนะนำสั้น ๆ ในจังหวะสำคัญ และหน้าสรุปอธิบายแต้มทีละส่วน',
        en: '**Beginner mode** (on / off in Settings) gives contracts with a trick to spare and no [[slam|slams]], slower bots, a reason when you tap a card you cannot play, short tips at key moments, and the score explained part by part on the summary.',
      },
    },
    {
      kind: 'p',
      text: {
        th: 'ปุ่ม **?** บนโต๊ะเปิดบทในคู่มือที่เกี่ยวกับตอนนั้นไว้ข้างโต๊ะ เช่นถึงตา dummy จะเปิดบทที่ 5 อ่านจบแล้วปิดกลับมาเล่นต่อได้เลย',
        en: "The **?** button on the table opens the guide chapter about what is happening, beside the table — on dummy's turn it opens chapter 5. Read it, close it and carry on playing.",
      },
    },
    { kind: 'h', text: { th: 'ภาษา', en: 'Language' } },
    {
      kind: 'p',
      text: {
        th: 'ปุ่ม**ธงชาติ**ที่มุมขวาบนของหน้าแรก (ธงไทย = ภาษาไทย, ธงสหราชอาณาจักร = ภาษาอังกฤษ หรือหัวข้อ**ภาษา**ในหน้าตั้งค่า) สลับหน้าจอเป็นภาษาไทยหรือภาษาอังกฤษได้ทุกเมื่อ ศัพท์ bridge เป็นคำเดียวกันทั้งสองภาษา',
        en: 'The **flags** at the top right of the home page (Thai flag = Thai, UK flag = English), or **Language** in Settings, switch the screens between Thai and English at any time. The bridge terms are the same in both.',
      },
    },
    { kind: 'h', text: { th: 'แจ้งปัญหา / ข้อเสนอแนะ', en: 'Report a bug / feedback' } },
    {
      kind: 'p',
      text: {
        th: 'เจอบั๊กหรืออยากเสนออะไร กดลิงก์**แจ้งปัญหา / ข้อเสนอแนะ**ท้ายหน้าแรก จะเปิดอีเมลถึงผู้พัฒนาที่มีหัวเรื่องและข้อมูลช่วยหาบั๊ก (หน้าที่เปิด ภาษา เบราว์เซอร์) ใส่ไว้ให้แล้ว เขียนเล่าเพิ่มแล้วส่งได้เลย ถ้าเครื่องไม่มีโปรแกรมอีเมล ส่งถึงที่อยู่อีเมลที่แสดงใต้ลิงก์แทน',
        en: 'Found a bug or have an idea? The **Report a bug / feedback** link at the bottom of the home page opens an email to the developer with the subject and some details that help find bugs (the page, the language, the browser) already filled in. Add what happened and send it. With no mail app on the device, write to the address shown under the link.',
      },
    },
    { kind: 'h', text: { th: 'ฝึกยังไงให้ได้ผล', en: 'How to practise well' } },
    {
      kind: 'list',
      items: [
        {
          th: 'เริ่มด้วยโหมดมือใหม่ จนลงไพ่ถูกกติกาได้คล่อง',
          en: 'Start with beginner mode until you play legal cards with ease',
        },
        {
          th: 'ก่อนลงใบแรก นับ [[winner]] หรือ [[loser]] แล้ววางแผน (บทที่ 7)',
          en: 'Before the first card, count [[winner|winners]] or [[loser|losers]] and make a plan (chapter 7)',
        },
        {
          th: 'เล่นให้จบโดยไม่ใช้คำใบ้ แล้วดูหน้าสรุปว่าพลาดตรงไหน',
          en: 'Play the hand out without hints, then see on the summary where you went wrong',
        },
        {
          th: 'กด "เล่นมือนี้ใหม่" แล้วแก้จุดที่พลาด',
          en: 'Press "Play this hand again" and fix the mistake',
        },
        {
          th: 'คล่องแล้วตั้งความยากเป็น **พอดี** — contract เท่ากับที่ทำได้สูงสุด ต้องเล่นถูกทุกใบ',
          en: 'Once you are comfortable, set the difficulty to **Exact** — the contract is the most the hand can make, so every card has to be right',
        },
        { th: 'ดูความก้าวหน้าในหน้า**สถิติ**', en: 'Follow your progress on the **Stats** page' },
      ],
    },
  ],
};
