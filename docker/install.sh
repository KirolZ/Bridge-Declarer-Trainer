#!/bin/sh
# Installs or updates Bridge Declarer Trainer from the prebuilt image in this folder.
# Shipped inside bridge-trainer-deploy.tar.gz (built with `pnpm package:images`).
# Usage: sh install.sh          (port: APP_PORT in .env, default 8081)
set -eu
cd "$(dirname "$0")"

if ! docker compose version >/dev/null 2>&1; then
  echo "ไม่พบ Docker Compose v2 — ติดตั้ง Docker Engine 24+ ก่อน" >&2
  exit 1
fi

if [ -f VERSION ]; then
  echo "==> Bridge Declarer Trainer $(cat VERSION)"
fi

# No secrets: the only setting is the port.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> สร้าง .env ให้แล้ว (แก้ APP_PORT ได้ถ้าพอร์ตชน)"
fi

echo "==> โหลด image"
docker load -i images.tar

echo "==> เปิดระบบ (รอจน healthy)"
if ! docker compose up -d --no-build --wait; then
  echo "เปิดไม่สำเร็จ — ดูสาเหตุด้วย: docker compose logs web  (ถ้าพอร์ตชน แก้ APP_PORT ใน .env)" >&2
  exit 1
fi

port=${APP_PORT:-$(sed -n 's/^APP_PORT=//p' .env | tr -d '\r' | tail -n 1)}
echo
echo "เสร็จแล้ว: เปิด http://localhost:${port:-8081} (เครื่องอื่นใน LAN: http://<IP ของเครื่องนี้>:${port:-8081})"
