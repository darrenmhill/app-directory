#!/bin/bash
# Local dev setup — uses Prisma's built-in PostgreSQL (no Docker needed)
set -e

echo "==> Starting local PostgreSQL via Prisma..."
npx prisma dev start 2>/dev/null || npx prisma dev &
sleep 5

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Pushing schema to database..."
npx prisma db push

echo ""
echo "Done! Run: npm run dev"
echo "Stop the database later with: npx prisma dev stop"
