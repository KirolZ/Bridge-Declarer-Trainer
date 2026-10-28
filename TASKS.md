# Tasks — Bridge Declarer Trainer

> ทำตามลำดับ อ่าน `SPEC.md` ก่อนเริ่มทุก session · ติ๊ก `[x]` เมื่อผ่านเงื่อนไข "เสร็จเมื่อ" · commit แยกทุก milestone
> ถ้าเจอ task ที่ใหญ่เกินไปให้แตกย่อยในไฟล์นี้ได้เลย และจดการตัดสินใจไว้ใน `DECISIONS.md`
> ช่วงที่เสี่ยงที่สุดคือ M3–M4 (solver) ให้ทำให้ถูกก่อน แล้วค่อยทำให้เร็ว
> เนื้อหาคู่มือ (M12) ต้องถูกตามกติกาสากล และแบบฝึกทุกข้อต้องผ่าน solver — ห้ามสอนผิด

## M1 — Scaffold

- [x] **1.1** `git init`, pnpm (pin ผ่าน `packageManager`), Vite + React 18 + TypeScript strict, โครงโฟลเดอร์ตาม SPEC §3
- [x] **1.2** Tailwind v4 (`@tailwindcss/vite`), Framer Motion, Zustand, hash router
- [x] **1.3** ESLint + Prettier (ยกค่าจาก Blackjack) + กฎ `no-restricted-imports` ไม่ให้ `engine/solver/bot` import React, DOM หรือ `ui/` / `game/` + ห้าม `Math.random` ใน `solver/` และ `bot/`
- [x] **1.4** Vitest + Playwright ติดตั้งพร้อม test ตัวอย่าง, script `dev / build / test / test:e2e / bench / typecheck / lint / format:check`
- [x] **1.5** `README.md` (โครง), `DECISIONS.md`, `.gitignore`, `.editorconfig`, `.gitattributes` (`eol=lf`)

**เสร็จเมื่อ:** `pnpm dev` เปิดหน้า hello ได้ และ `pnpm test`, `pnpm lint`, `pnpm typecheck` ผ่าน

## M2 — Engine (กติกา)

- [x] **2.1** type `Suit / Rank / Card / Seat / Strain / Deal / Contract` + helper (เทียบ rank, ชื่อ/สัญลักษณ์ดอก, เรียงมือ, HCP)
- [x] **2.2** สำรับ + แจก (Fisher–Yates, RNG แบบ crypto และแบบ seed mulberry32) + สลับ N↔S ให้ South แข็งกว่า
- [x] **2.3** encode / decode รหัสมือไพ่ 18 ตัวอักษร (SPEC §4.4) + validate, และ parse / format มือแบบ PBN (`AK3.Q2..T9`)
- [x] **2.4** `PlayState` + `legalPlays`, `applyPlay`, `currentTrick`, `toPlay`, `tricksWon`, `isComplete` (SPEC §4.2) — opening lead โดย West, ต้องลงตามดอก, trump กิน, รองรับมือที่มีไม่ครบ 13 ใบ (ทุกมือเท่ากัน) และเริ่มจากคนนำที่กำหนดได้
- [x] **2.5** scoring ตาม SPEC §4.3 (non-vul / vul, partscore, game, slam, overtrick, undertrick)
- [x] **2.6** unit test ครบทุกข้อข้างบน รวมกรณีขอบ: ไม่มีดอกที่นำแล้ว trump / ทิ้ง, trump ซ้อน trump, NT, grand slam, ขาด 13 trick

**เสร็จเมื่อ:** test ของ engine ผ่าน และ engine ไม่มี import อะไรนอก `src/engine`

## M3 — Solver: ถูกต้องก่อน

- [x] **3.1** `reference.ts`: brute-force minimax จาก `Position` (SPEC §5.1) รองรับเริ่มกลาง trick
- [x] **3.2** ตัวแทนข้อมูลภายในแบบ bitmask 13 bit ต่อดอกต่อมือ + แปลงไป/กลับจาก `Position`
- [x] **3.3** `solve` แบบ null-window ("NS ได้ ≥ t ไหม") + ตัดด้วยขอบเขตง่าย ๆ + หาค่าจริงด้วย MTD(f)
- [x] **3.4** `analyze` (ทุกใบที่ลงได้ → `nsTricks`)
- [x] **3.5** test เทียบกับ reference ≥ 2,000 ตำแหน่งสุ่ม (seed คงที่, มือละ ≤ 5 ใบ, suit + NT, เริ่มกลาง trick) + test คุณสมบัติตาม SPEC §5.3 (หมุนที่นั่ง 180° พร้อมย้ายคนที่ถึงตาตาม, สลับชื่อดอกใน NT, NS + EW = trick ที่เหลือ, `analyze` สอดคล้องกับ `solve`)

**เสร็จเมื่อ:** test ของ solver ผ่านทั้งหมด (ยังไม่ต้องเร็ว)

## M4 — Solver: ทำให้เร็ว

- [x] **4.1** `bench/` + `pnpm bench`: ชุดมือ 13 ใบแบบ seed คงที่ (≥ 50 มือ) วัด `solve`, `analyze`, `ddTable` พิมพ์ p50 / p95 — บันทึกผลก่อน optimize ไว้ใน `DECISIONS.md`
- [x] **4.2** ไพ่ที่เทียบเท่ากัน (sequence ใน relative rank) ค้นแค่ใบเดียว
- [x] **4.3** transposition table ที่ต้น trick (คีย์ relative rank + คนนำ + trump, เก็บขอบเขตบน/ล่าง, จำกัดขนาด)
- [x] **4.4** quick tricks / ขอบเขตที่ดีขึ้น
- [x] **4.5** move ordering (SPEC §5.2)
- [x] **4.6** `ddTable` ใช้ TT ร่วมกันระหว่างคนนำ/strain ได้เท่าที่ทำได้
- [x] **4.7** รัน test ของ M3 ซ้ำทุกครั้งหลัง optimize แต่ละข้อ และบันทึกผล bench หลังแต่ละข้อใน `DECISIONS.md`

**เสร็จเมื่อ:** ผ่านเป้า SPEC §5.4 และ test ของ M3 ยังผ่าน (ถ้ายังช้ากว่าเป้า > 3 เท่าหลังทำครบ ให้หยุดและเสนอทาง DDS → WASM ตาม SPEC §5.4)

> **สถานะ (2026-10-27):** ทำ 4.1–4.7 ครบ test ผ่าน แต่ solve มือ 13 ใบยังช้ากว่าเป้า 30–170 เท่า → ผู้ใช้เลือกทาง DDS → WASM (ข้อ 4.8–4.11)

- [x] **4.8** `scripts/build-dds.sh` (`pnpm build:dds`): DDS v3.1.1 (commit pin) + `native/dds/bridge.cpp` → `src/solver/dds/dds-wasm.mjs` ด้วย Emscripten ใน Docker (image pin), แบบ thread เดียว ไฟล์เดียว commit ผลลัพธ์ + `LICENSE-DDS`
- [x] **4.9** `src/solver/dds.ts`: `loadDds()` → `DdsSolver` ที่มี `solve / analyze / ddTable` ตาม SPEC §5.1 (ผลเหมือน `Solver` ทุกอย่าง รวมลำดับใบของ `analyze`)
- [x] **4.10** test DDS เทียบ reference (2,000 solve + 500 analyze, มือละ ≤ 4 ใบ, กลาง trick), เทียบ TS solver (analyze 300 ตำแหน่ง 5–8 ใบ, ddTable 7 ใบ) และมือเต็ม (ddTable ตรงกับ solve / analyze ทุก strain)
- [x] **4.11** `pnpm bench` ใช้ DDS เป็นค่าเริ่มต้น (`--engine ts` วัดตัว TS) — ผ่านเป้า SPEC §5.4 ทั้งสามงาน

> **สถานะ (2026-10-27):** M4 เสร็จด้วย DDS → WASM — solve p95 186 ms, analyze 379 ms, ddTable 966 ms (50 มือ 13 ใบ) ตัว TS `Solver` เก็บไว้ใช้ตรวจเทียบใน test

## M5 — Worker

- [x] **5.1** Web Worker ห่อ `solve / analyze / ddTable` + protocol `{ id, type, payload }` → `{ id, ok, result | error }`
- [x] **5.2** wrapper ฝั่ง main แบบ Promise + ยกเลิกได้ + `terminate()` แล้วสร้างใหม่เมื่อค้างนาน
- [x] **5.3** เก็บ TT ข้ามการเรียกของมือเดียวกัน ล้างเมื่อเปลี่ยนมือ
- [x] **5.4** test ของ wrapper (mock worker) + ลองเรียกจริงใน dev ว่า UI ไม่ค้างระหว่างคำนวณ

**เสร็จเมื่อ:** หน้า dev ทดลองเรียก `ddTable` ได้ผลโดยหน้าจอยังกดอย่างอื่นได้

> **สถานะ (2026-10-27):** M5 เสร็จ — `src/worker/` (protocol, `SolverHost`, `solver.worker.ts`, `SolverClient`, `getSolver()`)
> หน้า dev `#/dev/solver` + e2e ยืนยันว่ากดปุ่มได้และไม่มีเฟรมค้างระหว่างคำนวณ TT ของ DDS เก็บข้ามการเรียกในมือเดียวกันแล้ว

## M6 — แจกไพ่ + เลือก contract

- [x] **6.1** ตัวกรอง HCP ก่อนเรียก solver (SPEC §7.1 ข้อ 2)
- [x] **6.2** สร้างตัวเลือก contract จาก `ddTable` + เลือกตัวแต้มสูงสุดตามประเภทและความยาก (พอดี / มีเผื่อ)
- [x] **6.3** แจกใหม่สูงสุด 30 ครั้ง แล้วผ่อนเงื่อนไขพร้อมแจ้ง + ยกเลิกได้
- [x] **6.4** test ด้วย RNG แบบ seed: contract ที่ได้ตรงกับตั้งค่า และค่า DD ≥ trick ที่ต้องได้เสมอ

**เสร็จเมื่อ:** ฟังก์ชัน `newHand(settings)` คืน `{ deal, contract, ddTable }` ที่ถูกต้อง

> **สถานะ (2026-10-27):** M6 เสร็จ — `src/game/` (`newHand`, `chooseContract`, `DealSettings`) ตามแนวทาง 7 ข้อที่ผู้ใช้ยืนยัน (ดู DECISIONS M6)
> test ด้วย DDS ทุกประเภท × ความยาก: contract ตรงตั้งค่า, ค่า DD ≥ trick ที่ต้องได้ (พอดี = เท่ากัน, มีเผื่อ = เกิน 1)

## M7 — บอทฝั่งป้องกัน

- [x] **7.1** `chooseDefenderCard(pos, analysis, seedFromDeal)` ตาม SPEC §6 (ใบที่ดีที่สุด + tie-break 3 ข้อ)
- [x] **7.2** ใช้กับ opening lead ด้วย
- [x] **7.3** test: เลือกเฉพาะใบที่ค่า DD ดีที่สุดเสมอ, ตามดอกลงใบต่ำสุด, มือเดิมได้ใบเดิม, ไม่ลงผิดกติกา

**เสร็จเมื่อ:** test ผ่าน และให้บอทเล่นทั้ง 4 ที่นั่งแบบ DD ใน test ได้ผล trick ตรงกับ `solve`

> **สถานะ (2026-10-27):** M7 เสร็จ — `src/bot/` (`chooseCard`, `chooseDefenderCard`, `dealSeed`) ดู DECISIONS M7
> test: กติกา tie-break แต่ละข้อด้วยตำแหน่งที่ทำเอง, 1,500 ตำแหน่งสุ่มกับ DDS (ลงได้ / ดีที่สุด / ต่ำสุดในดอก / ซ้ำได้ผลเดิม),
> opening lead 20 มือ, บอทเล่นทั้ง 4 ที่นั่ง 20 มือเต็ม + 200 ตำแหน่งท้ายเกม ได้ trick เท่ากับ `solve` ทุกมือ

## M8 — หน้าเล่นเกม

- [x] **8.1** Zustand store: `PlayState`, สถานะรอ worker, คิวจังหวะบอท (500 ms / 800 ms ตามความเร็ว), เก็บค่า DD ก่อน/หลังทุกใบของผู้เล่น (ใช้ใน M10)
- [x] **8.2** component ไพ่ (ยกจาก Blackjack `PlayingCard.tsx`) + ธีมโต๊ะ
- [x] **8.3** เลย์เอาต์โต๊ะ SPEC §8: South, dummy แบบคอลัมน์ตามดอก, West/East หลังไพ่, trick กลางโต๊ะ, ไฮไลต์คนที่ถึงตา
- [x] **8.4** แผง contract / trick ที่ต้องได้ / trick ที่แต่ละฝ่ายได้
- [x] **8.5** กดลงไพ่ (ใบที่ลงไม่ได้จาง) + ลงจาก dummy เมื่อถึงตา North + คีย์บอร์ด (Tab / Enter)
- [x] **8.6** แอนิเมชันลงไพ่และเก็บ trick, dummy หงายหลัง opening lead
- [x] **8.7** หน้าแรก: ปุ่มเริ่มเล่น + "กำลังแจกไพ่..." + ยกเลิก
- [x] **8.8** route `#/play/<dealCode>/<contract>` เปิดมือจากลิงก์ได้
- [x] **8.9** มือถือแนวตั้ง 360 px ไม่มี scroll แนวนอน

**เสร็จเมื่อ:** เล่นได้ครบ 13 trick กับบอท ทั้งบน desktop และมือถือ และจบแล้วแสดงผล ทำได้ / ขาด + แต้ม

> **สถานะ (2026-10-27):** M8 เสร็จ — store `src/game/playStore.ts` (บอทเดินเอง + เก็บ `analyze` ทุกตำแหน่ง → `playerDdLog`), โต๊ะ `src/ui/table/`,
> หน้า `#/play/<dealCode>/<contract>` และหน้าแรกแจกไพ่ได้ (ดู DECISIONS M8) e2e เล่นครบ 13 trick ทั้ง desktop / มือถือ / 360 px ไม่มี scroll แนวนอน

## M9 — เครื่องมือฝึก

- [x] **9.1** คำใบ้ (ไฮไลต์ใบที่ดีที่สุด + ข้อความ "ยังทำได้ X trick", ปุ่ม `H`) + นับจำนวนครั้ง
- [x] **9.2** ย้อน (ตัดใบผู้เล่นล่าสุด + ใบบอทที่ตามมา, ยกเลิกงาน worker ที่ค้าง, ปุ่ม `U`)
- [x] **9.3** เล่นมือนี้ใหม่ / มือใหม่
- [x] **9.4** Claim (ตรวจด้วย `solve`)
- [x] **9.5** โหมดศึกษา: เปิดไพ่ทุกมือระหว่างเล่น (ไม่นับสถิติ)

**เสร็จเมื่อ:** ทุกปุ่มทำงานถูก และกดย้อนระหว่างบอทกำลังคิดแล้วไม่พัง

> **สถานะ (2026-10-27):** M9 เสร็จ — store มี `showHint / undo / restart / claim / setStudyMode`, แถบปุ่ม คำใบ้ / ย้อน / Claim / เมนู
> (`src/ui/table/ActionBar.tsx`, `ClaimDialog.tsx`), คีย์ `H` / `U`, หน้าผลมีปุ่มย้อน / เล่นมือนี้ใหม่ (ดู DECISIONS M9)
> test: store 7 ข้อ (รวม undo ระหว่างบอทคิด) + e2e `practice.spec.ts` (เล่นตามคำใบ้ทุกตาจนทำ contract ได้, H / U ระหว่างบอทคิด,
> claim ไม่ผ่าน / ผ่าน / ย้อน, เมนูเล่นใหม่ + โหมดศึกษา, 360 px) ทั้ง desktop และมือถือ

## M10 — วิเคราะห์หลังจบมือ

- [x] **10.1** คำนวณจุดที่เสีย trick จากค่า DD ก่อน/หลังที่เก็บไว้ + ใบที่ควรลงจาก `analyze` (คำนวณเพิ่มทีหลังถ้ายังไม่มี)
- [x] **10.2** หน้าสรุป: ผล, แต้ม, "ได้ X (DD ทำได้ Y)", รายการจุดที่เสีย trick, จำนวนคำใบ้
- [x] **10.3** ดูย้อนหลังทีละ trick (เห็นไพ่ทั้ง 4 มือ) + "ลองเล่นใหม่จากตรงนี้"
- [x] **10.4** ปุ่มแชร์มือนี้ (copy ลิงก์)

**เสร็จเมื่อ:** จงใจเล่นพลาด 1 จุดแล้วหน้าสรุปชี้ trick นั้นและใบที่ควรลงได้ถูก

> **ส่งต่อจาก M9 (อ่านก่อนเริ่ม):**
>
> - **มือที่จบด้วย claim** — `play.plays` ไม่ครบ 52 ใบ ผลอยู่ใน `claimed` (trick รวมของ NS) ใช้ `finalNsTricks(state)` /
>   `isHandOver(state)` แทน `isComplete(play)` ถ้า claim น้อยกว่าค่า DD ณ จุดนั้น (รับตามที่พูด) ต้องนับเป็นจุดเสีย trick ด้วย
>   — ค่า DD ของจุด claim อยู่ใน `analyses[play.plays.length]`
> - **ค่า DD ที่ยังไม่มี** — `playerDdLog` คืน `before / after = null` ถ้า analysis ยังไม่มาหรือพัง 10.1 ต้องคำนวณเพิ่ม
>   (ผ่าน solver ของ store ไม่ใช่ main thread)
> - **10.3 "ลองเล่นใหม่จากตรงนี้"** — store มี `rewind(n, extra)` ภายใน `createPlayStore` อยู่แล้ว (ใช้กับ undo / restart)
>   แค่เปิดเป็น action สาธารณะ (เช่น `rewindTo(n)`) ถ้า n เป็นตาบอท บอทจะเดินต่อเอง
> - **ใช้ซ้ำได้** — `OpenHand` ใน `src/ui/table/hands.tsx` (ผังมือแบบดอกละบรรทัด) สำหรับดูย้อนหลังเห็นไพ่ 4 มือ,
>   `ResultPanel` ตอนนี้แสดงผล / แต้ม / จำนวนคำใบ้ / ปุ่มย้อน + เล่นใหม่ — 10.2 ขยายจากตัวนี้หรือแยกเป็นหน้าใหม่ก็ได้
> - `hintsUsed`, `studied` อยู่ใน store แล้ว (10.2 ใช้จำนวนคำใบ้, M11 ใช้ `studied`)

> **สถานะ (2026-10-27):** M10 เสร็จ — `src/game/review.ts` (`reviewHand`, `reviewKeys`, `ddValueAt`, `replayTrickCount`),
> store เพิ่ม `rewindTo(n)` / `completeReview()`, หน้าสรุป `ResultPanel.tsx`, ดูย้อนหลัง `ReplayView.tsx`, `ShareButton.tsx` (ดู DECISIONS M10)
> test: store 4 ข้อ (พลาด 1 จุด, เติม analysis ที่พัง, claim น้อยกว่า DD, `rewindTo`) + e2e `review.spec.ts` (เล่นตามคำใบ้แต่จงใจพลาด 1 ใบ →
> หน้าสรุปชี้ trick / ใบที่ลง / ใบที่ควรลง = ใบที่คำใบ้ไฮไลต์ → ดูย้อนหลัง → ลองเล่นใหม่จากตรงนี้ → เสีย 0 trick, claim ขาด + แชร์ลิงก์, 360 px)
>
> **ส่งต่อให้ M11:** ผลของมือที่จบแล้ว = `reviewHand(play, analyses, claimed)` (`nsTricks`, `ddTricks`, `lost`) — บันทึกสถิติเมื่อ
> `review.complete` เท่านั้น (ไม่งั้น `lost` ยังไม่ครบ) และอย่าบันทึกซ้ำเมื่อผู้เล่นย้อน / ลองเล่นใหม่จากตรงนี้แล้วจบมืออีกรอบ
> (ต้องตัดสินว่านับครั้งแรกที่จบหรือครั้งล่าสุด) มือ `studied` ไม่นับ จุดเรียกที่เหมาะคือ effect ใน `PlayTable` ที่เรียก `completeReview`

## M11 — ตั้งค่า + สถิติ

- [x] **11.1** หน้าตั้งค่าตาม SPEC §7.6 เก็บใน `localStorage` (ครอบ try/catch)
- [x] **11.2** บันทึกสถิติหลังจบแต่ละมือ (ยกเว้นโหมดศึกษา) + หน้าสถิติ (แยก suit / NT)

**เสร็จเมื่อ:** ปิดแล้วเปิดเบราว์เซอร์ใหม่ ตั้งค่าและสถิติยังอยู่ และถ้าบล็อก storage เว็บยังใช้ได้

> **สถานะ (2026-10-27):** M11 เสร็จ — `src/game/storage.ts` (`createSafeStorage`, try/catch ทุกครั้ง + สำรองในหน่วยความจำ),
> `settings.ts` (`Settings`, `parseSettings`, `BOT_PACE` ย้ายมาจาก playStore), `stats.ts` (`addResult`, `statTotals`, `handResultOf`,
> `watchHandResults`), `saved.ts` (store ตั้งค่า / สถิติ), play store เพิ่ม `handSerial`, หน้า `#/settings` / `#/stats` (ดู DECISIONS M11)
> test: `saved.test.ts` 9 ข้อ (storage พัง 4 แบบ, อ่านค่าเสีย, 2 แท็บไม่ทับกัน, นับครั้งแรกครั้งเดียว / ไม่นับหลังย้อน / เล่นใหม่ / โหมดศึกษา)
> + e2e `settings-stats.spec.ts` (ตั้งค่า + จบมือ → context ใหม่จาก storageState ยังอยู่, บล็อก localStorage แล้วยังเล่น / ดูสถิติได้
> ไม่มี error, ย้อน claim แล้วจบอีกรอบนับ 1 มือ)
>
> **ส่งต่อให้ M12:**
>
> - `Settings.beginnerMode` มีแล้ว (เก็บ / อ่าน / validate) แต่**ยังไม่มีสวิตช์ในหน้าตั้งค่า** เพราะยังไม่มีผลอะไร — 12.8 เพิ่ม
>   `<label>` checkbox แบบเดียวกับโหมดศึกษาใน `SettingsPage.tsx` แล้วผูกพฤติกรรม: deal ใช้ `dealSettingsOf` → ให้บังคับ
>   `cushion` + ไม่มี slam ตรงนั้น, ความเร็ว "ช้า" ให้ทำใน subscription ของ `src/ui/gameStore.ts` (ที่ตั้ง `setPace`)
> - ความคืบหน้าคู่มือ / ข้อความ "เข้าใจแล้ว": ใช้ `browserStorage()` / `SafeStorage` เดิม เพิ่ม key ใน `STORAGE_KEYS`
>   (เช่น `bridge-trainer.learn.v1`) และ parse แบบทีละช่องเหมือน `parseSettings` "เปิดเว็บครั้งแรก" = key นี้ยังไม่มี
> - ตั้งค่าเปลี่ยนผ่าน `updateSettings(patch)` เท่านั้น (play store ตาม settings เอง อย่าเรียก `gameStore.setStudyMode` ตรง ๆ)

## M12 — คู่มือมือใหม่ + โหมดมือใหม่

- [x] **12.1** โครงคู่มือ `#/learn`: รายการบท + ความคืบหน้า, หน้าบทเรียน (ก่อน / ถัดไป), อภิธานศัพท์ + ลิงก์ศัพท์จากเนื้อหา, component แสดงไพ่ตัวอย่างในเนื้อหา
- [x] **12.2** รูปแบบข้อมูลแบบฝึก (SPEC §7.7) + หน้าแบบฝึก 3 ชนิด: เลือกใบที่ลงได้ / เลือกคำตอบ / เดินไพ่จนจบกับบอท DD + ลองใหม่ / ดูเฉลยทีละใบ / บอกจุดพลาด
- [x] **12.3** test ของแบบฝึกทุกข้อ: ข้อมูลถูกรูปแบบ, solver ยืนยันว่าเป้าทำได้, ใบที่ explanation บอกว่าผิดทำให้พลาดจริง
- [x] **12.4** เนื้อหาบทที่ 1–6 (กติกา) + แบบฝึก ≥ 2 ข้อต่อบท (บท 2–6)
- [x] **12.5** เนื้อหาบทที่ 7–13 (เทคนิคเดินไพ่) + แบบฝึกตำแหน่งท้ายเกม ≥ 2 ข้อต่อบท
- [x] **12.6** บทที่ 14 (ใช้เกมนี้ฝึกยังไง) + อภิธานศัพท์ครบทุกศัพท์ที่ใช้
- [x] **12.7** จุดเข้าคู่มือ: คำถาม "เคยเล่น bridge ไหม?" ครั้งแรก, ปุ่มคู่มือ + ความคืบหน้าที่หน้าแรก, ปุ่ม `?` บนโต๊ะเปิด panel บทที่เกี่ยวข้อง
- [x] **12.8** โหมดมือใหม่ (SPEC §7.8): contract ง่าย, เหตุผลเมื่อกดใบที่ลงไม่ได้, ข้อความแนะนำตามจังหวะ (แสดงครั้งเดียว), บอทช้า, คำอธิบายแต้มเต็มในหน้าสรุป
- [x] **12.9** ตรวจเนื้อหาทั้งหมดอีกรอบเทียบกติกาสากล และอ่านแบบคนไม่รู้จัก bridge (ศัพท์ทุกคำอธิบายแล้วตั้งแต่ครั้งแรก)

**เสร็จเมื่อ:** เปิดเว็บครั้งแรก → ตอบ "ไม่เคยเล่น" → อ่านบท 1–5 + ทำแบบฝึกผ่าน → เล่นมือแรกในโหมดมือใหม่จนจบได้ และ test ของแบบฝึกผ่านทั้งหมด

> **สถานะ (2026-10-28):** 12.1–12.3 เสร็จ — ข้อมูลใน `src/learn/` (`types`, `markup`, `glossary`, `chapters`, `exercises`, `exercise`,
> `progress`), แบบฝึกเดินไพ่ใช้ play store ตัวที่สอง (`exerciseStore`) + `src/game/exercise.ts` (`exerciseHand`, `exerciseOutcome`,
> `solutionLine`), หน้า `#/learn`, `#/learn/<n>`, `#/learn/ex/<id>`, `#/learn/glossary` ใน `src/ui/pages/LearnPages.tsx` +
> `src/ui/learn/` (ดู DECISIONS M12) ยังไม่ commit (commit ตอนจบ milestone)
> test: `src/learn/exercises.test.ts` (ทุกข้อ: รูปแบบ, คำตอบจาก engine, DDS ยืนยันเป้า / เส้นเฉลย / ใบที่ผิด), `content.test.ts`
> (markup, ลิงก์ศัพท์, ตัวอย่างไพ่, progress), `src/game/exercise.test.ts` (ผ่าน / พลาด + ชี้ใบ / เริ่มกลาง trick + undo ไม่ย้อนเกินจุดเริ่ม)
> + e2e `learn.spec.ts` (desktop + มือถือ + 360 px)
>
> **สถานะ (2026-10-28):** 12.4 เสร็จ — เนื้อหาบท 1–6 แยกไฟล์ `src/learn/chapters/ch01.ts`…`ch06.ts` (บท 7–14 ยังอยู่ใน
> `chapters.ts` แบบว่าง), แบบฝึกบท 2–6 รวม 15 ข้อ (บท 2: 3, บท 3: 3, บท 4: 3, บท 5: 3, บท 6: 3) + อภิธานศัพท์เพิ่ม 11 คำ
> test เพิ่ม: คำตอบของแบบฝึก `choice` คิดจาก engine (`CHOICE_ANSWERS` ใน `exercises.test.ts` — จำนวน trick, trump, แต้ม,
> opening lead, game) ข้อที่ engine ตอบไม่ได้ต้องอยู่ใน `ANSWERED_BY_HAND`, คำบรรยายตัวอย่าง trick ที่บอกว่า "X กิน" ต้องตรงกับ
> engine ทุกบท, บทที่เขียนแล้ว (ยกเว้นบท 1) ต้องมีแบบฝึก ≥ 2 ข้อ
>
> **สถานะ (2026-10-28):** 12.5 เสร็จ — บท 7–13 แยกไฟล์ `chapters/ch07.ts`…`ch13.ts` (เหลือบท 14 ที่ยังว่างใน `chapters.ts`),
> แบบฝึกเดินไพ่ใหม่ 13 ข้อ (บทละ 2, บท 10 รวมข้อเดิมเป็น 2) ทุกข้อผ่าน DDS + อภิธานศัพท์เพิ่ม 10 คำ (ดู DECISIONS 12.5)
> ทั้งหมด `pnpm test` 396 ข้อผ่าน, lint / typecheck ผ่าน
>
> **สถานะ (2026-10-28):** 12.6–12.8 เสร็จ (ดู DECISIONS 12.6–12.8)
>
> - 12.6: บท 14 (`chapters/ch14.ts`) + แบบฝึกตัวเลือก 3 ข้อ (อยู่ใน `ANSWERED_BY_HAND`), อภิธานศัพท์เพิ่ม claim, double, double-dummy (DD),
>   NS / EW, overruff + ช่อง `aliases` (vul, bidding, small / grand slam, blocked) test ใหม่: ทุกคำภาษาอังกฤษในคู่มือต้องเป็นศัพท์ใน
>   อภิธานศัพท์ และตัวหนาห้ามมี `{…}` / `[[…]]` ข้างใน (เจอบั๊กเดิม 4 จุดที่แสดง `{C}` / `4{H}` ดิบ ๆ — แก้แล้ว)
> - 12.7: คำถาม "เคยเล่น bridge ไหม?" ที่หน้าแรก (`isFirstVisit`, `LearnProgress.welcomed`), ปุ่มคู่มือ + "x/14 บท", ปุ่ม `?` บนโต๊ะ →
>   `GuidePanel` (บทจาก `guideChapterFor` ใน `src/game/coach.ts`)
> - 12.8: `beginnerMode` มีสวิตช์ในตั้งค่าแล้ว → deal `noSlam` + `cushion`, บอทช้า (`botSpeedOf`), เหตุผลใบที่ลงไม่ได้ในบรรทัดสถานะ,
>   ข้อความแนะนำ (`coachTip` + `CoachTip.tsx`, ที่ปิดแล้วเก็บใน `LearnProgress.tips`), หน้าสรุปอธิบายแต้ม (`scoreExplain.ts`)
> - test: `coach.test.ts`, `scoreExplain.test.ts` (ผลรวมตรงกับ engine ทุก contract / ทุกผล), contract / saved / content test เพิ่ม,
>   e2e `beginner.spec.ts` (ครั้งแรก → ไม่เคย → บท 1 + โหมดมือใหม่, ข้อความแนะนำ / เหตุผล / panel `?` / อธิบายแต้ม / ปิดแล้วไม่ขึ้นอีก)
>   + `play.spec.ts` ตอบ "เคยเล่นแล้ว" — `pnpm test` 424 ข้อ, `pnpm test:e2e` 52 ข้อผ่าน, lint / typecheck / format ผ่าน
>
> **สถานะ (2026-10-28):** 12.9 เสร็จ (ดู DECISIONS 12.9) — ตรวจทุกบท / อภิธานศัพท์ / แบบฝึก / ข้อความบนโต๊ะเทียบกติกาสากล
> ไม่เจอกติกาผิด แก้ถ้อยคำที่อ่านแล้วเข้าใจผิดได้ 10 จุด + ศัพท์ที่ครั้งแรกไม่มีลิงก์ / คำแปล 5 คำ test ใหม่: ศัพท์ทุกคำต้องลิงก์ตั้งแต่
> ครั้งแรกที่เจอตามลำดับอ่าน — `pnpm test` 425 ข้อผ่าน, lint / typecheck / format ผ่าน M12 ครบทุกข้อ ยังไม่ commit
>
> **ส่งต่อให้ 12.9:**
>
> - ข้อความที่ test ตรวจความถูกต้องไม่ได้ ต้องอ่านเอง: แบบฝึกใน `ANSWERED_BY_HAND` (รวม 3 ข้อของบท 14), ข้อความแนะนำใน
>   `src/ui/table/CoachTip.tsx`, `illegalText` ใน `labels.ts`, คำอธิบายแต้มใน `scoreExplain.ts` (ตัวเลขตรวจแล้ว ภาษายังไม่ได้ตรวจ)
> - test คำศัพท์ตรวจเฉพาะเนื้อหาใน `src/learn/` ข้อความบนหน้าจอเกม (ปุ่ม, หน้าสรุป, ตั้งค่า) ตรวจแค่รายการศัพท์ที่เขียนไว้ใน test
>   ("covers the terms the game screens use") ถ้าหน้าจอใช้ศัพท์ใหม่ต้องเพิ่มเอง
> - บท 14 อธิบายปุ่มตามหน้าจอตอนนี้ ถ้าเปลี่ยนชื่อปุ่ม / เมนูต้องแก้บท 14 ด้วย
>
> **ส่งต่อให้ 12.5–12.6 (จากตอน 12.1–12.3):**
>
> - บทที่ 10 มีแบบฝึก 1 ข้อแล้ว (`ch10-finesse-aq`) บทใหม่ให้เขียนเป็นไฟล์ `chapters/chNN.ts` แบบบท 1–6 ตัวอย่างตำแหน่งท้ายเกม
>   ใช้ block `deal` (ใส่ `trump` เพื่อให้ขึ้นกลางผัง)
> - เนื้อหาเขียนด้วย markup: `[[id]]` / `[[id|ข้อความ]]` = ลิงก์ศัพท์, `{SA}` = ไพ่, `{S}` = ดอก, `**ตัวหนา**` test จะ fail ถ้าลิงก์ศัพท์
>   ที่ไม่มีใน `GLOSSARY` — เพิ่มศัพท์ก่อนใช้ (12.6 เติมให้ครบ)
> - แบบฝึก `play` ต้องมี `solution` (ใบ NS ทั้งเส้น) และ `wrong` ≥ 1 (`at` = จำนวนใบที่ลงไปแล้วตามเส้นเฉลย) test เช็กกับ DDS ให้เอง
>   ถ้าใบใน `wrong` ไม่ได้ทำให้พลาดจริง test จะ fail — เขียนแล้วรัน `pnpm vitest run src/learn` ทุกครั้ง
> - test "≥ 2 แบบฝึกต่อบท" มีแล้ว ใช้กับบทที่มี blocks — เขียนเนื้อหาบทไหนต้องมีแบบฝึก ≥ 2 ข้อพร้อมกัน
> - 12.8: `illegalText(reason)` ใน `src/ui/table/labels.ts` ใช้บอกเหตุผลใบที่ลงไม่ได้ได้เลย
> - 12.7: ความคืบหน้าอยู่ใน `learnStore` (key `bridge-trainer.learn.v1`) ยังไม่มีช่อง "ตอบคำถามครั้งแรกแล้ว" — "เปิดเว็บครั้งแรก"
>   = key ยังไม่มี ตามที่ M11 ฝากไว้ หน้าแรกมีลิงก์ "คู่มือ" ธรรมดาแล้ว (ยังไม่แสดงความคืบหน้า)

## M13 — Deploy + Hardening

- [ ] **13.1** `Dockerfile` + `docker/nginx.conf` + security headers (CSP มี `worker-src`) ยกจาก Blackjack
- [ ] **13.2** `docker-compose.yml` (`name: bridge-trainer`, image `bridge-trainer-web:latest`, `${APP_PORT:-8081}:8080`)
- [ ] **13.3** `pnpm package:images` → `bridge-trainer-deploy.tar.gz` + `docker/install.sh` (ปรับจาก Blackjack: image เดียว, ไม่ต้องสุ่ม secret)
- [ ] **13.4** e2e ตาม SPEC §10 (ผู้ใช้ใหม่เข้าคู่มือ → ผ่านแบบฝึกบทที่ 2; เล่นตามคำใบ้จนจบ → ทำ contract ได้ + เสีย 0 trick, desktop + มือถือ, ไม่มี error ใน console)
- [ ] **13.5** README: วิธีรัน dev / test / bench / deploy (Docker, ไฟล์เดียว, GitHub Pages) + เปิดให้คนใน LAN เข้า
- [ ] **13.6** ทดสอบติดตั้งจาก bundle ในโฟลเดอร์ชั่วคราวด้วย project name แยก (อย่าไปทับ stack จริง)

**เสร็จเมื่อ:** ครบ Definition of Done ใน SPEC §11
