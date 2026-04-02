#!/bin/bash
# Deploy to Railway — switches schema to PostgreSQL, deploys, then switches back
set -e

echo "==> Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
  echo "Railway CLI not found. Install: npm i -g @railway/cli"
  exit 1
fi

echo "==> Checking Railway login..."
if ! railway whoami &> /dev/null 2>&1; then
  echo "Not logged in. Run: railway login"
  exit 1
fi

echo "==> Switching schema to PostgreSQL for deploy..."
sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Swap prisma.ts to use PrismaPg
cat > src/lib/prisma.ts << 'PRISMA_TS'
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
PRISMA_TS

echo "==> Deploying to Railway..."
railway up --detach

echo "==> Restoring local SQLite config..."
mv prisma/schema.prisma.bak prisma/schema.prisma

cat > src/lib/prisma.ts << 'PRISMA_TS'
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL || "file:prisma/dev.db";
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
PRISMA_TS

npx prisma generate > /dev/null 2>&1

echo ""
echo "Deploy triggered! Monitor at: railway status"
echo "Or open dashboard: railway open"
