# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

App Directory is a personal portfolio website that auto-fetches GitHub repos from `darrenmhill` and displays them as project cards. It includes a password-protected admin panel for managing project metadata, screenshots, production URLs, and visibility.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Prisma 7** with PostgreSQL (via `@prisma/adapter-pg`)
- **Railway** deployment with `standalone` output

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
```

## Architecture

### Data Flow
- GitHub API → `src/lib/github.ts` (fetch + 5min cache) → `src/lib/github-sync.ts` (upsert to DB)
- Sync runs on-demand (admin button) or auto if stale (>1 hour) on public page load
- Sync only updates GitHub-sourced fields (`stars`, `language`, `githubUrl`), never overwrites admin-edited fields

### Auth
- Simple password auth via `ADMIN_PASSWORD` env var
- HMAC-signed HttpOnly cookie (`admin_session`)
- `src/middleware.ts` protects `/admin/*` and `/api/admin/*` routes
- Full cookie verification in `src/lib/auth.ts`

### Screenshots
- Stored as binary (`Bytes`) in PostgreSQL to survive Railway's ephemeral filesystem
- Served via `/api/screenshots/[id]` with cache headers
- Upload limit: 5MB, PNG/JPEG/WebP only

### Key Routes
| Route | Purpose |
|-------|---------|
| `/` | Public project grid (server component) |
| `/admin` | Project management table |
| `/admin/projects/[id]` | Edit project details + upload screenshot |
| `/api/admin/sync` | Trigger GitHub repo sync |

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Yes | Admin panel password |
| `GITHUB_TOKEN` | No | GitHub API token (higher rate limits, private repo access) |
| `NEXT_PUBLIC_SITE_TITLE` | No | Site heading (default: "App Directory") |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | No | Meta/OG description for SEO |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute origin for canonical URLs, sitemap, OG (falls back to `RAILWAY_PUBLIC_DOMAIN`) |

## Prisma Notes

- Prisma 7 uses driver adapters — the client is initialized with `PrismaPg` in `src/lib/prisma.ts`
- Generated client lives in `src/generated/prisma/` (gitignored)
- Import from `@/generated/prisma/client`, not `@prisma/client`
- After schema changes: `npx prisma generate && npx prisma db push`
