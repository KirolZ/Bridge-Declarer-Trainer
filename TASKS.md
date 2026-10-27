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

- [ ] **8.1** Zustand store: `PlayState`, สถานะรอ worker, คิวจังหวะบอท (500 ms / 800 ms ตามความเร็ว), เก็บค่า DD ก่อน/หลังทุกใบของผู้เล่น (ใช้ใน M10)
- [ ] **8.2** component ไพ่ (ยกจาก Blackjack `PlayingCard.tsx`) + ธีมโต๊ะ
- [ ] **8.3** เลย์เอาต์โต๊ะ SPEC §8: South, dummy แบบคอลัมน์ตามดอก, West/East หลังไพ่, trick กลางโต๊ะ, ไฮไลต์คนที่ถึงตา
- [ ] **8.4** แผง contract / trick ที่ต้องได้ / trick ที่แต่ละฝ่ายได้
- [ ] **8.5** กดลงไพ่ (ใบที่ลงไม่ได้จาง) + ลงจาก dummy เมื่อถึงตา North + คีย์บอร์ด (Tab / Enter)
- [ ] **8.6** แอนิเมชันลงไพ่และเก็บ trick, dummy หงายหลัง opening lead
- [ ] **8.7** หน้าแรก: ปุ่มเริ่มเล่น + "กำลังแจกไพ่..." + ยกเลิก
- [ ] **8.8** route `#/play/<dealCode>/<contract>` เปิดมือจากลิงก์ได้
- [ ] **8.9** มือถือแนวตั้ง 360 px ไม่มี scroll แนวนอน

**เสร็จเมื่อ:** เล่นได้ครบ 13 trick กับบอท ทั้งบน desktop และมือถือ และจบแล้วแสดงผล ทำได้ / ขาด + แต้ม

## M9 — เครื่องมือฝึก

- [ ] **9.1** คำใบ้ (ไฮไลต์ใบที่ดีที่สุด + ข้อความ "ยังทำได้ X trick", ปุ่ม `H`) + นับจำนวนครั้ง
- [ ] **9.2** ย้อน (ตัดใบผู้เล่นล่าสุด + ใบบอทที่ตามมา, ยกเลิกงาน worker ที่ค้าง, ปุ่ม `U`)
- [ ] **9.3** เล่นมือนี้ใหม่ / มือใหม่
- [ ] **9.4** Claim (ตรวจด้วย `solve`)
- [ ] **9.5** โหมดศึกษา: เปิดไพ่ทุกมือระหว่างเล่น (ไม่นับสถิติ)

**เสร็จเมื่อ:** ทุกปุ่มทำงานถูก และกดย้อนระหว่างบอทกำลังคิดแล้วไม่พัง

## M10 — วิเคราะห์หลังจบมือ

- [ ] **10.1** คำนวณจุดที่เสีย trick จากค่า DD ก่อน/หลังที่เก็บไว้ + ใบที่ควรลงจาก `analyze` (คำนวณเพิ่มทีหลังถ้ายังไม่มี)
- [ ] **10.2** หน้าสรุป: ผล, แต้ม, "ได้ X (DD ทำได้ Y)", รายการจุดที่เสีย trick, จำนวนคำใบ้
- [ ] **10.3** ดูย้อนหลังทีละ trick (เห็นไพ่ทั้ง 4 มือ) + "ลองเล่นใหม่จากตรงนี้"
- [ ] **10.4** ปุ่มแชร์มือนี้ (copy ลิงก์)

**เสร็จเมื่อ:** จงใจเล่นพลาด 1 จุดแล้วหน้าสรุปชี้ trick นั้นและใบที่ควรลงได้ถูก

## M11 — ตั้งค่า + สถิติ

- [ ] **11.1** หน้าตั้งค่าตาม SPEC §7.6 เก็บใน `localStorage` (ครอบ try/catch)
- [ ] **11.2** บันทึกสถิติหลังจบแต่ละมือ (ยกเว้นโหมดศึกษา) + หน้าสถิติ (แยก suit / NT)

**เสร็จเมื่อ:** ปิดแล้วเปิดเบราว์เซอร์ใหม่ ตั้งค่าและสถิติยังอยู่ และถ้าบล็อก storage เว็บยังใช้ได้

## M12 — คู่มือมือใหม่ + โหมดมือใหม่

- [ ] **12.1** โครงคู่มือ `#/learn`: รายการบท + ความคืบหน้า, หน้าบทเรียน (ก่อน / ถัดไป), อภิธานศัพท์ + ลิงก์ศัพท์จากเนื้อหา, component แสดงไพ่ตัวอย่างในเนื้อหา
- [ ] **12.2** รูปแบบข้อมูลแบบฝึก (SPEC §7.7) + หน้าแบบฝึก 3 ชนิด: เลือกใบที่ลงได้ / เลือกคำตอบ / เดินไพ่จนจบกับบอท DD + ลองใหม่ / ดูเฉลยทีละใบ / บอกจุดพลาด
- [ ] **12.3** test ของแบบฝึกทุกข้อ: ข้อมูลถูกรูปแบบ, solver ยืนยันว่าเป้าทำได้, ใบที่ explanation บอกว่าผิดทำให้พลาดจริง
- [ ] **12.4** เนื้อหาบทที่ 1–6 (กติกา) + แบบฝึก ≥ 2 ข้อต่อบท (บท 2–6)
- [ ] **12.5** เนื้อหาบทที่ 7–13 (เทคนิคเดินไพ่) + แบบฝึกตำแหน่งท้ายเกม ≥ 2 ข้อต่อบท
- [ ] **12.6** บทที่ 14 (ใช้เกมนี้ฝึกยังไง) + อภิธานศัพท์ครบทุกศัพท์ที่ใช้
- [ ] **12.7** จุดเข้าคู่มือ: คำถาม "เคยเล่น bridge ไหม?" ครั้งแรก, ปุ่มคู่มือ + ความคืบหน้าที่หน้าแรก, ปุ่ม `?` บนโต๊ะเปิด panel บทที่เกี่ยวข้อง
- [ ] **12.8** โหมดมือใหม่ (SPEC §7.8): contract ง่าย, เหตุผลเมื่อกดใบที่ลงไม่ได้, ข้อความแนะนำตามจังหวะ (แสดงครั้งเดียว), บอทช้า, คำอธิบายแต้มเต็มในหน้าสรุป
- [ ] **12.9** ตรวจเนื้อหาทั้งหมดอีกรอบเทียบกติกาสากล และอ่านแบบคนไม่รู้จัก bridge (ศัพท์ทุกคำอธิบายแล้วตั้งแต่ครั้งแรก)

**เสร็จเมื่อ:** เปิดเว็บครั้งแรก → ตอบ "ไม่เคยเล่น" → อ่านบท 1–5 + ทำแบบฝึกผ่าน → เล่นมือแรกในโหมดมือใหม่จนจบได้ และ test ของแบบฝึกผ่านทั้งหมด

## M13 — Deploy + Hardening

- [ ] **13.1** `Dockerfile` + `docker/nginx.conf` + security headers (CSP มี `worker-src`) ยกจาก Blackjack
- [ ] **13.2** `docker-compose.yml` (`name: bridge-trainer`, image `bridge-trainer-web:latest`, `${APP_PORT:-8081}:8080`)
- [ ] **13.3** `pnpm package:images` → `bridge-trainer-deploy.tar.gz` + `docker/install.sh` (ปรับจาก Blackjack: image เดียว, ไม่ต้องสุ่ม secret)
- [ ] **13.4** e2e ตาม SPEC §10 (ผู้ใช้ใหม่เข้าคู่มือ → ผ่านแบบฝึกบทที่ 2; เล่นตามคำใบ้จนจบ → ทำ contract ได้ + เสีย 0 trick, desktop + มือถือ, ไม่มี error ใน console)
- [ ] **13.5** README: วิธีรัน dev / test / bench / deploy (Docker, ไฟล์เดียว, GitHub Pages) + เปิดให้คนใน LAN เข้า
- [ ] **13.6** ทดสอบติดตั้งจาก bundle ในโฟลเดอร์ชั่วคราวด้วย project name แยก (อย่าไปทับ stack จริง)

**เสร็จเมื่อ:** ครบ Definition of Done ใน SPEC §11
