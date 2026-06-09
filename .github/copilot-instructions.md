# Copilot Instructions — Palpite Perfeito

## ⚠️ Important: Next.js Version

This project runs **Next.js 16.2** — a version with breaking changes from what most AI models know. Before writing any Next.js-specific code (routing, Server Actions, caching, config), read the relevant guide in `node_modules/next/dist/docs/` and heed any deprecation notices.

---

## Commands

```bash
# Development
npm run dev               # Turbopack dev server on :3000

# Production
npm run build
npm run start

# Lint & Test
npm run lint              # ESLint
npm run test              # Vitest (single run)
npm run test:watch        # Vitest watch mode
npm run test:coverage     # Coverage (scoped to src/lib/**)

# Run a single test file
npx vitest run src/__tests__/game-logic.test.ts

# Database
npx prisma db push        # Apply schema changes without migration
npx prisma generate       # Regenerate Prisma client after schema edits
npx prisma studio         # Visual DB browser

# Seeds (controlled via SEED_MODE env var in prisma/seed.ts)
npm run prisma:seed:worldcup           # Full Copa do Mundo 2026 dataset
npm run prisma:seed:brasileirao-test   # Smaller test dataset (Brasileirão round 10)
npm run prisma:seed:admin              # Admin user only
```

---

## Architecture

The app is a **Next.js 16.2** full-stack app using the App Router, deployed on Kubernetes (namespace `palpite-prod`) via Helm with a standalone Docker build.

### Key layers

| Layer | Location | Notes |
|---|---|---|
| Pages | `src/app/(main)/` | Route group — all user-facing pages |
| Admin | `src/app/(main)/admin/` | Requires `ADMIN` role |
| Server Actions | `src/app/actions/` | `"use server"` — all mutations go here |
| Core logic | `src/lib/` | Pure functions; tested with Vitest |
| Prisma client | `src/lib/prisma.ts` | Singleton, throws if `DATABASE_URL` is missing |
| Auth config | `src/lib/auth.ts` | NextAuth v5 (beta), JWT strategy, Credentials only |
| Tests | `src/__tests__/` | Node environment, `@/` alias resolves to `src/` |

### Auth flow

NextAuth v5 with `session: { strategy: "jwt" }`. The JWT callback injects `id` and `role` into the token. Roles: `USER` | `ADMIN`.

`src/lib/auth-helpers.ts` provides two guards for Server Actions:
- `getRequiredUser()` — redirects to `/auth` if unauthenticated
- `requireAdmin()` — redirects to `/` if not `ADMIN`

Rate limiting for login attempts is tracked in the DB via `src/lib/auth-rate-limit.ts`.

The Next.js middleware lives in **`src/proxy.ts`** (not the usual `middleware.ts`) and uses NextAuth's `auth` to protect all routes except `/api/auth`, `/auth`, and static assets.

### Scoring & recalculation

Scoring rules live in `src/lib/game-logic.ts` (`calculateGuessPoints`) and `src/lib/scoring.ts`. After admin results are submitted, `recalculateUsersTotalPoints()` in `src/lib/points-recalculation.ts` is called within a **Prisma transaction** to sum points from `Guess`, `TopScorerBet`, and `ChampionBet` and write them back to `User.totalPoints`.

### Database models

```
User             → role: USER | ADMIN, paymentConfirmed: bool, totalPoints
Match            → status: SCHEDULED | FINISHED, datetime in UTC
Goal             → player, team, minute — linked to Match
Guess            → palpite per user per match, pointsEarned nullable
TopScorerBet     → one per user, unique, pointsEarned nullable
ChampionBet      → one per user, unique, pointsEarned nullable
TournamentResult → official artilheiro and champion
LoginAttempt     → rate limiting rows; cleared by resetCompetitionData()
```

---

## Key Conventions

### Timezones — always use `America/Sao_Paulo`

All match datetimes are stored in UTC. Display and comparison always go through `src/lib/timezone.ts` using `date-fns-tz`. Never compare raw `Date` objects without converting to SP timezone first.

```ts
import { isBettingOpen, formatMatchDate, parseMatchDateTimeInput } from "@/lib/timezone";
```

Betting closes **10 minutes before** match start. This is validated on both client and server.

### Server Actions pattern

Every mutation is a Server Action (`"use server"`) in `src/app/actions/`. They:
1. Call `getRequiredUser()` (or `requireAdmin()` for admin routes) first
2. Check `user.paymentConfirmed` before allowing bet placement
3. Validate input range (scores 0–30, integers only)
4. Check betting deadline via `canUserPlaceGuess(match.datetime)`
5. Return `{ error: "..." }` for expected failures; throw for unexpected ones
6. Call `revalidatePath()` at the end to invalidate cached pages

### Path alias

`@/` maps to `src/`. Always use this alias for imports within the project.

### Seed system

`prisma/seed.ts` reads `SEED_MODE` env var to select the dataset. All seed modes call a shared reset helper that preserves or drops matches depending on context. Seeds are also triggerable from the admin panel in the running app.

### shadcn/ui components

UI components from shadcn/ui live in `src/components/ui/`. When adding new shadcn components, use `npx shadcn add <component>` — do not manually create files in that directory.

### Betting deadline UI

`src/lib/bet-dashboard.ts` provides helpers for displaying countdown and color-coded deadline badges: `getBettingDeadlineInfo()`, `formatRemainingTime()`, `getBettingDeadlineTone()`. Reuse these rather than recalculating deadlines in components.

### React Compiler

`reactCompiler: true` is set in `next.config.ts`. Manual `useMemo` / `useCallback` / `memo` are redundant for most cases — the compiler handles memoization automatically.

### Payment gate

Users must have `paymentConfirmed: true` on their `User` record before they can place any bet. Server Actions return `{ error: PAYMENT_PENDING_MESSAGE }` (from `src/lib/payment.ts`) if not confirmed.

### Forced password change

Admin can set a temporary password for any user via `resetUserPassword()` in `src/app/actions/admin.ts`. This sets `User.mustChangePassword = true`. Enforcement happens at two levels:
- `getRequiredUser()` redirects to `/change-password` if the flag is set (blocks all Server Actions)
- `(main)/layout.tsx` redirects to `/change-password` for all app pages

The `/change-password` page (outside `(main)/`) calls the `changePassword()` action in `src/app/actions/auth.ts`, which validates the flag is set before allowing the update and then resets it to `false`.
