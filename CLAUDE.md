# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ The directive above is critical: this is **Next.js 16.2** with React 19 and the React Compiler enabled. APIs differ from older Next.js. Read `node_modules/next/dist/docs/` before writing framework code.

## Project

**Palpite Perfeito** — a World Cup 2026 betting pool (bolão). Users predict match scores, top scorer, and champion; points accrue as the admin enters real results. UI text and domain terms are in Brazilian Portuguese.

## Commands

```bash
npm run dev            # Next dev server (Turbopack)
npm run build          # Production build (output: standalone)
npm run start          # Serve build on 0.0.0.0:3000
npm run lint           # ESLint (next core-web-vitals + typescript)
npm run test           # vitest run (one-shot)
npm run test:watch     # vitest watch
npm run test:coverage  # coverage (only src/lib/** is instrumented)

# single test file / name
npx vitest run src/__tests__/game-logic.test.ts
npx vitest run -t "calculateGuessPoints"

# Prisma / DB (PostgreSQL)
npx prisma db push     # sync schema to DB (no migration files used in dev)
npx prisma studio
npx prisma generate
npm run prisma:seed:admin            # admin user only (SEED_MODE=admin-only)
npm run prisma:seed:worldcup         # full World Cup base
npm run prisma:seed:brasileirao-test # small Brasileirão round-10 test base
```

`DATABASE_URL` is mandatory — `src/lib/prisma.ts` and `prisma.config.ts` throw if it is unset.

## Architecture

**Stack:** Next.js 16 App Router (Server Components + Server Actions), Prisma 6 / PostgreSQL, NextAuth v5 (beta) with JWT + Credentials, bcrypt, Tailwind 4, shadcn/ui (`src/components/ui`). Path alias `@/*` → `src/*`.

### Mutations go through Server Actions, not API routes
All writes live in `src/app/actions/*.ts` (`"use server"`). The only API route is NextAuth at `src/app/api/auth/[...nextauth]`. Action conventions to follow:
- Return `{ error: string }` or `{ success: true }` — actions don't throw to the client for expected failures.
- Authenticate with `getRequiredUser()` (users) or `requireAdmin()` from `src/lib/auth-helpers.ts`; admin actions always re-check on the server.
- Gate user bets on `user.paymentConfirmed` (returns `PAYMENT_PENDING_MESSAGE` from `src/lib/payment.ts`).
- After a mutation, call `revalidatePath(...)` for every affected route (`/`, `/ranking`, `/my-bets`, `/admin`).

### Scoring — single source of truth
`src/lib/game-logic.ts` owns `calculateGuessPoints()` (the 25/20/18/15/5/0 ladder). `src/lib/scoring.ts` is only a backward-compat re-export — don't fork the logic there. Special-bet scoring (top scorer, champion) lives in `src/app/actions/special-bets.ts`.

`User.totalPoints` is **denormalized**. When results or bets change, recompute it via `recalculateUsersTotalPoints(tx, userIds)` (`src/lib/points-recalculation.ts`) inside a Prisma `$transaction` — it sums match guesses + top-scorer + champion points. Never set `totalPoints` ad hoc.

### Timezone & betting deadline
All datetimes are stored in **UTC**; all user-facing logic compares in `America/Sao_Paulo`. Use the helpers in `src/lib/timezone.ts` — never raw `Date` math. Betting closes **10 minutes before kickoff**: `isBettingOpen()` / `canUserPlaceGuess()` enforce this on the server, and `src/lib/bet-dashboard.ts` derives countdown UI state (`green/yellow/red` tone). Special bets close 10 min before the *first* match and are **write-once** (no edits after save).
(Note: some doc comments mention SQLite — stale; the DB is PostgreSQL.)

### Auth & rate limiting
`src/lib/auth.ts` configures NextAuth (JWT carries `id` + `role`; see `src/types/next-auth.d.ts`). Every login attempt is logged to the `LoginAttempt` table and checked by `src/lib/auth-rate-limit.ts` (sliding window per IP and per email, escalating blocks). `User.mustChangePassword` forces a redirect to `/change-password` via `getRequiredUser()`.

### Routes
User pages live under the `src/app/(main)` route group (jogos, ranking, my-bets, special-bets, premiacao, help, admin). The admin dashboard is one large client component, `src/components/AdminPanel.tsx`, driving the admin actions.

### Tests
Vitest, `environment: node`, coverage limited to `src/lib/**`. Pure domain logic (scoring, timezone) is the unit-tested layer — keep new business rules there so they're testable without the DB.

## Deploy
Kubernetes via Helm (`k8s/charts`), not Docker Compose. `scripts/deploy-prod.sh` applies the Postgres cluster + ingress + app to namespace `palpite-prod`, runs `prisma db push`, seeds admin in-pod, then smoke-tests `/api/health` and `/auth`. CI in `.github/workflows`. Required env/secrets: `NEXTAUTH_URL`, `AUTH_SECRET`, `ADMIN_PASS`, `POSTGRES_*`.
