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

## Test

```sh
pnpm test         # Vitest: engine / solver / bot / แบบฝึก
pnpm test:e2e     # Playwright (build + vite preview ให้เอง; ตั้ง E2E_BASE_URL เพื่อยิงเซิร์ฟเวอร์ที่รันอยู่แล้ว)
pnpm typecheck
pnpm lint
pnpm format:check
```

ครั้งแรกที่รัน e2e บนเครื่องใหม่ อาจต้องติดตั้ง browser ก่อน: `pnpm exec playwright install chromium`

## Bench

```sh
pnpm bench        # วัดความเร็ว solver (p50 / p95) — เริ่มใช้ได้จริงตั้งแต่ M4
```

## Build / Deploy

```sh
pnpm build        # ได้ dist/ เป็นไฟล์ static (hash routing — host ที่ไหนก็ได้)
```

วิธี deploy ด้วย Docker และแพ็กไฟล์เดียว จะเพิ่มใน M13

## โครงสร้าง

| โฟลเดอร์     | หน้าที่                                     |
| ------------ | ------------------------------------------- |
| `src/engine` | กติกา bridge ล้วน (pure TS)                 |
| `src/solver` | double-dummy solver + reference brute-force |
| `src/bot`    | เลือกใบของบอทฝั่งป้องกัน                    |
| `src/worker` | Web Worker ห่อ solver                       |
| `src/game`   | Zustand store ของมือที่กำลังเล่น            |
| `src/learn`  | เนื้อหาคู่มือ + ข้อมูลแบบฝึก                |
| `src/ui`     | React components + pages                    |
| `bench/`     | สคริปต์วัดความเร็ว solver                   |
| `e2e/`       | Playwright                                  |

`engine` / `solver` / `bot` ห้ามใช้ React, DOM, Zustand หรือ import `ui/` `game/` `worker/`
บังคับสองชั้น: ESLint (`no-restricted-imports`, `no-restricted-globals`, ห้าม `Math.random`)
และ `tsconfig.core.json` ที่ type-check โฟลเดอร์เหล่านี้โดยไม่มี DOM types
