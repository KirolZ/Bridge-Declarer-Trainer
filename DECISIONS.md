# Decisions

บันทึกการตัดสินใจที่สเปกไม่ได้ระบุชัด หรือที่ต่างจากสเปก (ใหม่สุดอยู่ล่างสุด)

## M1 — Scaffold (2026-10-27)

- **pnpm 12.15.0** — pin ตามเวอร์ชันที่ติดตั้งในเครื่อง pnpm ≥ 10 บล็อก build script ของ dependency
  เป็นค่าเริ่มต้น จึงอนุญาตเฉพาะ `esbuild` ไว้ใน `pnpm-workspace.yaml` (`allowBuilds`)
  ไฟล์นี้มีไว้เก็บ config ของ pnpm เท่านั้น โปรเจกต์ยังเป็น package เดียว ไม่ใช่ monorepo
- **เวอร์ชัน dependency** — ใช้ชุดเดียวกับ Blackjack (Vite 5.4, Vitest 2.1, TS 5.6, Tailwind 4.3,
  Playwright 1.64.1) เพื่อให้ใช้ Playwright browser ที่ติดตั้งไว้แล้วร่วมกันได้ และลดความเสี่ยงเรื่องความเข้ากัน
- **Hash router** — ใช้ `createHashRouter` ของ `react-router-dom` v7 แทนการเขียนเอง
- **บังคับขอบเขต engine/solver/bot สองชั้น** — นอกจาก ESLint ตามสเปกแล้ว เพิ่ม `tsconfig.core.json`
  ที่ type-check โฟลเดอร์เหล่านี้ด้วย `lib: ES2022` ล้วน (ไม่มี DOM, ไม่มี @types/node)
  ใช้ DOM API เมื่อไหร่ `pnpm typecheck` จะพังทันที — ใน M2 การเรียก `crypto.getRandomValues`
  จึงต้องเข้าผ่าน `globalThis` พร้อม type ที่ประกาศเอง
- **ห้าม `Math.random` ใน `engine/` ด้วย** (สเปกกำหนดแค่ solver/bot) เพราะสเปก §4.1 ให้การแจกใช้ crypto
  หรือ RNG แบบ seed อยู่แล้ว
- **Bench รันด้วย `tsx`** — Node รัน TS ที่ import แบบไม่มีนามสกุลไฟล์เองไม่ได้
- **e2e** — ค่าเริ่มต้นให้ Playwright `build` + `vite preview` (พอร์ต 4173) เอง ถ้าตั้ง `E2E_BASE_URL`
  จะยิงเซิร์ฟเวอร์ที่รันอยู่แล้วแทน (ใช้กับ Docker ใน M13) รันทั้ง desktop และมือถือ (Pixel 7)
- **Vite `base: './'`** — asset เป็น path แบบ relative เพื่อให้ `dist/` วางไว้ใต้ sub-path ไหนก็ได้
  (เช่น GitHub Pages)
- `SPEC.md` / `TASKS.md` ไม่ผ่าน Prettier เพื่อไม่ให้ format เอกสารต้นฉบับใหม่

## M2 — Engine (2026-10-27)

- **โมดูล** — `card` (type + helper), `rng`, `deal`, `encode` (รหัสมือ 18 ตัว, PBN, รหัส contract), `play`,
  `scoring` รวมไว้ที่ `src/engine/index.ts` ลบ placeholder `suits.ts` จาก M1 ทิ้ง
- **`Rng` = ฟังก์ชันคืนเลขทศนิยม [0, 1)** ทั้ง `mulberry32(seed)` และ `cryptoRng()` (crypto เติม buffer
  ทีละ 64 ค่า) `dealRandom()` ใช้ crypto ถ้าไม่ส่ง RNG มา ส่วน `withStrongerSouth` แยกเป็นฟังก์ชันของตัวเอง
  (§7.1 ข้อ 1) ให้ M6 เรียกต่อเอง
- **`PlayState.leader` (optional)** — คนนำ trick แรก ค่าเริ่มต้นคือคนทางซ้ายของ declarer (West)
  ใช้กับแบบฝึกที่เริ่มจากคนนำอื่น นอกนั้นตรงตาม §4.2
- **`toPlay` คืน `null` เมื่อจบมือ** และ `currentTrick` คืน `[]` ทันทีที่ trick ครบ 4 ใบ
  (UI ใช้ `completedTricks().at(-1)` แสดง trick ที่เพิ่งจบ)
- **`illegalReason(state, card)`** — คืนเหตุผลที่ลงใบนั้นไม่ได้ (`must-follow-suit` + ดอก, `not-in-hand`,
  `hand-complete`) เตรียมไว้ให้โหมดมือใหม่ (§7.8) บอกเหตุผลได้โดยไม่ต้องเขียนกติกาซ้ำใน UI
- **รหัสมือไพ่ decode แบบเข้มงวด** — ต้องยาว 18 ตัวพอดี, ไม่มี `=`, และ 4 bit ท้ายต้องเป็น 0
  จึงมีรหัสเดียวต่อมือ (ลิงก์เทียบกันตรง ๆ ได้)
- **PBN** — รับเฉพาะ `T` แทน 10 (ไม่รับ `10`) และตัวพิมพ์ใหญ่เท่านั้น นอกจากมือเดี่ยวแล้วมี
  `parseDealPbn` / `formatDealPbn` แบบ `N:<N> <E> <S> <W>` (ไล่ตามเข็มนาฬิกาจากทิศแรก) ไว้เขียน test / แบบฝึก
- **รหัส contract ใน URL** — `encodeContract` / `decodeContract` (`4S`, `3N`) อยู่ใน engine ด้วย
- **Scoring** — `scoreBreakdown` คืนแต้มแยกส่วน (contract, overtrick, game/partscore, slam, undertrick)
  ไว้ใช้กับคำอธิบายแต้มเต็มในโหมดมือใหม่ `score` คืนแค่ยอดรวม
- **ชื่อดอกภาษาไทย** — `SUIT_INFO` มีทั้งชื่ออังกฤษและไทย (โพดำ / โพแดง / ข้าวหลามตัด / ดอกจิก)
- **Test ขอบเขต engine** — `boundary.test.ts` สแกนว่าไฟล์ใน `src/engine` import ได้แค่ `./...`

## M3 — Solver: ถูกต้องก่อน (2026-10-27)

- **โมดูล** — `position` (type `Position`, `validatePosition`, `legalCards`, `positionFromPlayState`),
  `reference` (brute-force), `bits` (ตัวแทนแบบ bitmask), `search` (`DDSearch` แกนการค้น), `solve` (API §5.1)
  รวมที่ `src/solver/index.ts` ส่วน `testing.ts` เป็นตัวช่วยของ test (สุ่มตำแหน่ง, หมุนที่นั่ง, เปลี่ยนชื่อดอก)
  แอปไม่ได้ใช้
- **solver import ได้แค่ `./...` กับ `../engine`** — มี test สแกน import แบบเดียวกับ engine
- **ตรวจ `Position` ทุกครั้งที่เข้า `solve` / `analyze` / reference** — ใบใน trick ต้องลงโดยที่นั่งติดกันจบก่อน
  `toPlay`, มือที่ลงใน trick แล้วมีน้อยกว่ามืออื่น 1 ใบ, ไม่มีใบซ้ำ ผิดแล้ว throw `invalid position: ...`
  (ตรวจไม่ได้ว่าใบใน trick ลงตามดอกถูกไหม เพราะไม่รู้ว่าเคยมีดอกนั้นหรือเปล่า)
- **bitmask** — `hands[seat * 4 + suit]` เป็น `Int32Array(16)` bit = rank − 2, ที่นั่ง N=0 E=1 S=2 W=3
  (NS เป็นเลขคู่), ดอก ♠=0 ♥=1 ♦=2 ♣=3, NT = 4, ใบไพ่เป็นตัวเลข `(suit << 4) | bit` (ดอกเดียวกัน
  เลขมากกว่า = ใบสูงกว่า) ใน hot loop ส่งค่าเป็นตัวเลขล้วน ไม่สร้าง object
- **null-window + MTD(f)** — `reaches(..., target)` ถามว่า NS ได้ ≥ target trick จาก trick ที่เหลือ (นับ trick
  ที่กำลังเล่นด้วย) ไหม ตัดด้วยขอบเขต `target ≤ 0 → true`, `target > trick ที่เหลือ → false` แล้ว `value()`
  เริ่มเดาที่ครึ่งหนึ่งของ trick ที่เหลือ ขยับขึ้นลงทีละ 1 จนขอบล่าง = ขอบบน `analyze` ใช้ค่าของใบก่อนหน้า
  เป็นค่าเดาของใบถัดไป
- **`analyze` คืนทุกใบที่ลงได้** (ยังไม่รวมใบที่เทียบเท่ากัน) เรียงตามดอก ♠ ♥ ♦ ♣ และสูงไปต่ำ เพราะบอท (M7)
  และคำใบ้ต้องรู้ค่าของทุกใบ
- **มือที่เล่นจบแล้ว** — `positionFromPlayState` คืนมือว่างและให้คนที่กิน trick สุดท้ายเป็น `toPlay`,
  `solve` ได้ 0
- **`ddTable` รับมือขนาด 1–13 ใบ** (ทุกมือเท่ากัน) West นำเสมอ — ใช้ test กับมือเล็กได้
- **reference** — minimax ล้วน ไม่มี pruning / bound / cache แต่แก้ array ของมือในที่แล้วคืนค่า (ไม่ copy
  ทั้งตำแหน่งทุก node) เร็วขึ้นราว 2 เท่าและยังอ่านง่าย
- **ชุด test เทียบ reference** — 2,000 ตำแหน่งขนาด 1–4 ใบ (มี test ยืนยันว่าเกินครึ่งเริ่มกลาง trick
  และครบทั้ง 5 strain) + ตำแหน่ง 5 ใบอีก 12 ตำแหน่ง เพราะ reference ใช้เวลาถึงหลายวินาทีต่อตำแหน่ง 5 ใบ
  `SOLVER_SLOW=1 pnpm test` เพิ่มเป็น 200 ตำแหน่ง (ใช้ตอน optimize ใน M4) + `analyze` เทียบ reference
  ทีละใบ 500 ตำแหน่ง + ddTable 30 มือ ตัวสุ่มเลือกไพ่จาก 1–4 ดอก (ยิ่งน้อยดอกยิ่งแย่ง trick กันมาก)
- **test คุณสมบัติ** (มือ 1–6 ใบ, 300–500 ตำแหน่งต่อข้อ) — หมุนโต๊ะ 180°, เปลี่ยนชื่อดอกใน NT, เพิ่มเปลี่ยนชื่อดอก
  พร้อม trump ในเกม suit, NS + EW = trick ที่เหลือ (EW นับด้วยการหมุนโต๊ะ 90° ให้ EW ไปนั่ง NS),
  `analyze` สอดคล้องกับ `solve` และมีตำแหน่งที่ตรวจด้วยมือ (finesse, squeeze, ruff / overruff, เริ่มกลาง trick)
- **ความเร็วตอนจบ M3** (ยังไม่มี TT / ใบเทียบเท่า, `tsx`): มือ 6 ใบเฉลี่ย 2.4 ms, 7 ใบ 93 ms (แย่สุด 0.9 s),
  8 ใบ 549 ms (แย่สุด 3 s) — มือเต็ม 13 ใบยังใช้ไม่ได้ ต้องรอ M4

## M4 — Solver: ทำให้เร็ว (2026-10-27) — TS ไม่ผ่านเป้า → ใช้ DDS → WASM (ดูหัวข้อถัดไป)

- **`Solver` class** — เก็บ TT ข้ามการเรียกได้ (`new Solver({ ttBits, plain })`, `clear()`) ส่วน `solve` /
  `analyze` / `ddTable` แบบฟังก์ชันใช้ instance ร่วมตัวเดียว `plain: true` ปิด TT และขอบเขต trick แน่ ๆ
  ไว้ใช้เทียบใน test เท่านั้น
- **bench** — `pnpm bench [--deals N] [--cards K] [--only solve|analyze|ddTable]` มือ seed คงที่
  (`mulberry32(1000 + i)`), strain ของ solve / analyze วนครบ 5 แบบ, ล้าง TT ก่อนทุกงาน (เวลาแบบ cold),
  พิมพ์ p50 / p95 / max / nodes / TT hit และ exit code 1 ถ้ามือ 13 ใบไม่ผ่านเป้า
- **ใบเทียบเท่า (4.2)** — ค้นแค่ใบบนสุดของแต่ละช่วงใบที่ติดกันในมือเดียวกัน (นับเฉพาะใบที่ยังไม่ออก
  แต่ใบใน trick ที่กำลังเล่นยังนับว่าอยู่ เพราะยังตัดสินผล trick นี้) `analyze` คำนวณครั้งเดียวต่อช่วงแล้ว
  ใช้ค่าเดียวกันทุกใบในช่วง
- **TT (4.3)** — เก็บที่ต้น trick ที่เหลือ ≥ 3 trick (สั้นกว่านั้นค้นใหม่ถูกกว่า) คีย์เป็น relative rank
  จึงใช้ได้กับทุกมือ ไม่ใช่แค่มือที่กำลังแก้ → ไม่ต้องล้างเพื่อความถูกต้อง ล้างแค่คืนหน่วยความจำ
  เพิ่มจากสเปก: **จับคู่แบบบางส่วน (partition search อย่างง่าย)** — การค้นรายงานว่าผลขึ้นกับ rank ของใบไหน
  (1) "exact": ใบดอกเดียวกันใน trick ที่ชนะกันด้วย rank ต้องคงลำดับ (2) "floor": ใบนี้และทุกใบที่สูงกว่า
  (ใช้เมื่อผู้ชนะเป็นใบสูงสุดที่เหลือ หรือเมื่อตัดด้วย quick trick / top trump — floor ต้องลากขึ้นไปถึง trick
  ก่อนหน้าด้วย เพราะอาจมีใบสูงกว่าที่ออกไประหว่างทาง) เลือกแบบที่เก็บใบน้อยกว่าในแต่ละ trick, ใบที่ข้ามไป
  เพราะเทียบเท่ากันต้องถูกเก็บด้วยถ้าใบตัวแทน rank สำคัญ entry เก็บความยาวดอกของทุกมือ + เจ้าของใบเฉพาะ
  ตำแหน่งที่สำคัญ (mask) + ใบบนสุดทุกดอก, bucket 32 ช่องตาม (ความยาวดอก, คนนำ, trump, เจ้าของใบบนสุด),
  แทนที่ entry ที่ตื้นที่สุด, 2^19 entry ≈ 25 MB, เก็บใบนำที่ทำให้ตัดกิ่งได้ไว้ลองก่อนครั้งหน้า
- **ขอบเขต (4.4)** — quick tricks ของคนนำ (ช่วงใบสูงสุดของตัวเอง + วิ่งดอกจากมือคู่ได้ 1 ดอก, จำกัดตามความยาว
  ของฝ่ายตรงข้ามที่มี trump, ไม่นับดอกข้างถ้าคู่มีแต่ trump) และ top trumps (ช่วง trump สูงสุดในมือเดียวได้
  trick แน่ ทั้งสองฝ่าย)
- **move ordering (4.5)** — นำ: ใบชนะ > ลงต่ำหาใบชนะของคู่ > ดอกยาว, ไม่นำดอกที่ฝ่ายตรงข้ามตัดได้, นำดอก
  ที่คู่ตัดได้; ตาม: มือ 2 ลงต่ำ, มือ 3 / 4 ชนะด้วยใบต่ำสุดที่ชนะแน่ หรือลงต่ำถ้าคู่ชนะอยู่, ตัดด้วย trump
  ต่ำสุด, ทิ้งใบต่ำและเก็บ trump
- **4.6** — TT ใช้ร่วมกันอยู่แล้วโดยโครงสร้าง: ทุก strain ของ `ddTable` และทุกใบของ `analyze` ใช้ TT เดียวกัน
  (คีย์มี trump) และ instance เดียวใช้ต่อได้ข้ามการเรียก
- **test เพิ่ม** — เทียบกับการค้นแบบ `plain` ที่มือ 5–7 ใบ: solve 300 ตำแหน่ง (TT ใช้ร่วม), 300 ตำแหน่งด้วย
  TT ขนาด 32 entry (ชนกันและถูกไล่ตลอด), analyze 150 ตำแหน่ง, ddTable 15 มือ — ผ่านทั้งหมด พร้อม test ของ M3
  ทุกข้อและ `SOLVER_SLOW=1` (200 ตำแหน่ง 5 ใบ)

### ผล bench ทีละขั้น (solve, p95)

| ขั้น                                                   | 7 ใบ   | 8 ใบ   | 10 ใบ (20 มือ) | 11 ใบ (20 มือ)       |
| ------------------------------------------------------ | ------ | ------ | -------------- | -------------------- |
| ก่อน optimize (M3)                                     | 252 ms | 14.4 s | —              | —                    |
| 4.2 ใบเทียบเท่า                                        | 20 ms  | 501 ms | —              | —                    |
| 4.3 TT (relative rank ตรงทุกใบ)                        | —      | 21 ms  | 351 ms         | —                    |
| 4.4 + 4.5 quick tricks + move ordering                 | —      | —      | 102 ms         | 627 ms (1.64M nodes) |
| + ใบนำที่ดีที่สุดใน TT, top trumps, วิ่งดอกจากมือคู่   | —      | —      | 91 ms          | 515 ms (1.31M)       |
| + TT จับคู่บางส่วน (exact + floor, 32 ช่อง, ≥ 3 trick) | —      | —      | —              | 343 ms (706k)        |

ก่อน optimize ที่ 7 ใบ (50 มือ): analyze p95 479 ms, ddTable p95 2.56 s

**มือเต็ม 13 ใบ (5 มือ, solve): p50 32.6 s, แย่สุด 170 s** — ช้ากว่าเป้า 1 s ราว 30–170 เท่า (เกิน 3 เท่าที่ TASKS
กำหนดให้หยุด) แต่ละใบที่เพิ่มยังแพงขึ้นราว 5–10 เท่า analyze / ddTable 13 ใบไม่ได้วัด (นานเกินไป)
→ หยุดตาม TASKS M4 แล้วเสนอทาง DDS → WASM (SPEC §5.4) ผู้ใช้เลือกทางนี้

## M4 (ต่อ) — DDS → WebAssembly (2026-10-27)

- **ตัวที่ใช้** — DDS v3.1.1 (`dds-bridge/dds`, commit `cd953c2`, Apache-2.0) build ด้วย `em++` จาก image
  `emscripten/emsdk:6.0.12` ผ่าน Docker (`pnpm build:dds`) ไม่ใช้ Bazel ของ DDS เพราะหนักเกินจำเป็น
  แค่ compile `library/src/**/*.cpp` ทั้งหมดตรง ๆ source ดึงมาไว้ที่ `.cache/dds` (gitignore)
  **ไฟล์ที่ build แล้ว (`src/solver/dds/dds-wasm.mjs`) commit เข้า repo** — คนที่แค่ dev / test / build
  ไม่ต้องมี Docker หรือ Emscripten
- **ตัวเลือกการ build** — thread เดียว (DDS เลือก `DDS_THREADS_NONE` เองเมื่อไม่กำหนด) จึงไม่ต้องใช้
  SharedArrayBuffer / COOP-COEP; `SINGLE_FILE` ฝัง wasm ไว้ใน ES module (439 KB, หลัง Vite bundle 560 KB,
  gzip 136 KB) โหลดได้เหมือนกันใน Node, Vite และ Worker; `-fwasm-exceptions` แบบ legacy
  (`WASM_LEGACY_EXCEPTIONS=1`) เพื่อให้รันบนเบราว์เซอร์รุ่นก่อนหน้าได้กว้างกว่า exnref; memory เริ่ม 64 MB
  แล้วขยายได้, stack 8 MB ตามที่ DDS ต้องการ
- **wrapper (`native/dds/bridge.cpp`, โค้ดของเรา)** — ส่งข้อมูลเป็น int array แบบ encoding ของ DDS
  `bt_solve` ใช้ `solve_board` (target −1, mode 1 = ค้นเสมอแม้มีใบเดียว, solutions 1 หรือ 3) แล้วกระจาย
  `equals` ให้ได้ทุกใบ `bt_calc_table` ใช้ `calc_dd_table` ใช้ `SolverContext` แยกกัน 2 ตัว (เล่น / ตาราง)
  TT แบบ Small (20–30 MB) เหมือน web build ของ DDS เอง และ `reset_for_solve()` ทุกครั้ง
  (ไม่เก็บ TT ข้ามการเรียกแบบ SPEC §5.5 — DDS เร็วพอแล้ว)
- **ฝั่ง TS (`src/solver/dds.ts`)** — `loadDds()` (async ครั้งเดียว) → `DdsSolver` ที่ `solve / analyze /
ddTable` เป็น sync ตาม SPEC §5.1 คะแนนจาก DDS เป็นของฝ่ายที่ถึงตา นับรวม trick ปัจจุบัน → แปลงเป็น
  ของ NS, `analyze` เรียงใบตามลำดับเดียวกับ `Solver` `ddTable` ของมือไม่ครบ 13 ใบใช้ `solve` ทีละ strain
  (`calc_dd_table` ต้องการมือเต็ม)
- **ตัว TS `Solver` ไม่ลบ** — ใช้เป็นตัวเทียบใน test ร่วมกับ reference brute-force
- **Vite** เตือนว่า `node:module` ถูกแทนด้วย stub ตอน build สำหรับเบราว์เซอร์ — เป็น code ฝั่ง Node
  ที่ไม่ถูกเรียกในเบราว์เซอร์ ไม่มีผล
- **license** — Apache-2.0 อนุญาตให้แจกจ่ายได้ ต้องแนบ license ไปด้วย: `src/solver/dds/LICENSE-DDS`
  และระบุเครดิตใน README (หน้าเกี่ยวกับ / เครดิตในแอปให้ทำตอน M11–M13)

### ผล bench (DDS, Node 24, 50 มือ 13 ใบ)

| งาน     | p50    | p95    | max    | เป้า p95 |
| ------- | ------ | ------ | ------ | -------- |
| solve   | 16 ms  | 186 ms | 239 ms | 1 s ✓    |
| analyze | 38 ms  | 379 ms | 525 ms | 1.5 s ✓  |
| ddTable | 179 ms | 966 ms | 1.57 s | 4 s ✓    |
