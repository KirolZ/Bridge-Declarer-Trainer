# Bridge Declarer Trainer

เว็บฝึกเดินไพ่ฝั่ง declarer ใน Contract Bridge แบบเล่นคนเดียว บอทฝั่งป้องกันเล่นแบบ double-dummy
ทุกอย่างรันในเบราว์เซอร์ (solver รันใน Web Worker) ไม่มี backend

> สเปกเต็มอยู่ที่ [`SPEC.md`](SPEC.md) · ลำดับงานที่ [`TASKS.md`](TASKS.md) · การตัดสินใจที่ [`DECISIONS.md`](DECISIONS.md)

## ต้องมี

- Node.js ≥ 20
- pnpm (เปิดผ่าน `corepack enable` แล้วจะได้เวอร์ชันตาม `packageManager` ใน `package.json`)

```sh
pnpm install
```

## Dev

```sh
pnpm dev          # http://localhost:5173
```

หน้า `#/dev/solver` (ไม่มีลิงก์จากแอป) ใช้ลองเรียก solver ผ่าน Web Worker: ddTable มือสุ่ม / 10 มือ,
เล่นทั้งมือแบบ DD, ยกเลิก และดูว่าหน้าจอยังกดได้ (ตัวนับ + เฟรมที่ค้างนานสุด)

## Test

```sh
pnpm test         # Vitest: engine / solver / bot / แบบฝึก
SOLVER_SLOW=1 pnpm test   # เพิ่มตำแหน่ง 5 ใบที่เทียบกับ reference solver เป็น 200 ตำแหน่ง (ช้า)
pnpm test:e2e     # Playwright (build + vite preview ให้เอง; ตั้ง E2E_BASE_URL เพื่อยิงเซิร์ฟเวอร์ที่รันอยู่แล้ว)
pnpm typecheck
pnpm lint
pnpm format:check
```

ครั้งแรกที่รัน e2e บนเครื่องใหม่ อาจต้องติดตั้ง browser ก่อน: `pnpm exec playwright install chromium`

## Bench

```sh
pnpm bench                # วัดความเร็ว solver DDS (p50 / p95) เทียบเป้า SPEC §5.4
pnpm bench --engine ts    # วัดตัว TS (ช้า ใช้กับ --cards 8 เป็นต้น)
pnpm bench --only play    # เล่นทั้งมือ: เก็บ TT ข้ามการเรียก เทียบกับล้างทุกครั้ง
```

## Solver (DDS)

solver ที่ใช้จริงคือ [DDS](https://github.com/dds-bridge/dds) ของ Bo Haglund, Soren Hein และผู้ร่วมพัฒนา
(Apache-2.0, ดู `src/solver/dds/LICENSE-DDS`) compile เป็น WebAssembly แล้ว commit ไว้ที่
`src/solver/dds/dds-wasm.mjs` ส่วน solver ที่เขียนด้วย TS ล้วนเก็บไว้ใช้ตรวจเทียบใน test

build ใหม่เฉพาะตอนจะเปลี่ยนเวอร์ชัน DDS หรือแก้ `native/dds/bridge.cpp` (ต้องมี git + Docker):

```sh
pnpm build:dds
```

## Build / Deploy

```sh
pnpm build        # ได้ dist/ เป็นไฟล์ static (hash routing — host ที่ไหนก็ได้)
```

วิธี deploy ด้วย Docker และแพ็กไฟล์เดียว จะเพิ่มใน M13

## โครงสร้าง

| โฟลเดอร์     | หน้าที่                                                     |
| ------------ | ----------------------------------------------------------- |
| `src/engine` | กติกา bridge ล้วน (pure TS)                                 |
| `src/solver` | double-dummy solver (DDS wasm + TS) + reference brute-force |
| `native/dds` | wrapper C++ ของ DDS สำหรับ build wasm                       |
| `src/bot`    | เลือกใบของบอทฝั่งป้องกัน                                    |
| `src/worker` | Web Worker ห่อ solver + `SolverClient` (Promise / ยกเลิก)   |
| `src/game`   | Zustand store ของมือที่กำลังเล่น                            |
| `src/learn`  | เนื้อหาคู่มือ + ข้อมูลแบบฝึก                                |
| `src/ui`     | React components + pages                                    |
| `bench/`     | สคริปต์วัดความเร็ว solver                                   |
| `e2e/`       | Playwright                                                  |

`engine` / `solver` / `bot` ห้ามใช้ React, DOM, Zustand หรือ import `ui/` `game/` `worker/`
บังคับสองชั้น: ESLint (`no-restricted-imports`, `no-restricted-globals`, ห้าม `Math.random`)
และ `tsconfig.core.json` ที่ type-check โฟลเดอร์เหล่านี้โดยไม่มี DOM types
