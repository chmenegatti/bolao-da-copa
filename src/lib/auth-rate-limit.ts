import { prisma } from "@/lib/prisma";

const WINDOW_MINUTES = 10;
const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_EMAIL = 7;

const BASE_BLOCK_MINUTES = 5;
const MEDIUM_BLOCK_MINUTES = 15;
const LONG_BLOCK_MINUTES = 60;

function getWindowStart(now: Date): Date {
  return new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);
}

function normalizeIp(rawIp: string | null | undefined): string {
  if (!rawIp) return "unknown";
  const first = rawIp.split(",")[0]?.trim();
  return first || "unknown";
}

export function getClientIp(request?: Request): string {
  if (!request) return "unknown";
  const xff = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return normalizeIp(xff ?? realIp ?? undefined);
}

function getBlockDurationMinutes(failuresInWindow: number): number {
  if (failuresInWindow >= 16) return LONG_BLOCK_MINUTES;
  if (failuresInWindow >= 10) return MEDIUM_BLOCK_MINUTES;
  if (failuresInWindow >= 5) return BASE_BLOCK_MINUTES;
  return 0;
}

export async function getRateLimitState(params: {
  email: string;
  ip: string;
}): Promise<{ blocked: boolean; retryAfterSeconds: number }> {
  const now = new Date();
  const windowStart = getWindowStart(now);

  const [ipFailuresRows, emailFailuresRows, lastBlockedRows] = await Promise.all([
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*) as total
      FROM "LoginAttempt"
      WHERE "ip" = ${params.ip}
        AND "success" = false
        AND "createdAt" >= ${windowStart}
    `,
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*) as total
      FROM "LoginAttempt"
      WHERE "email" = ${params.email}
        AND "success" = false
        AND "createdAt" >= ${windowStart}
    `,
    prisma.$queryRaw<{ createdAt: Date }[]>`
      SELECT "createdAt"
      FROM "LoginAttempt"
      WHERE ("ip" = ${params.ip} OR "email" = ${params.email})
        AND "blocked" = true
        AND "createdAt" >= ${new Date(now.getTime() - LONG_BLOCK_MINUTES * 60 * 1000)}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `,
  ]);

  const ipFailures = Number(ipFailuresRows[0]?.total ?? 0);
  const emailFailures = Number(emailFailuresRows[0]?.total ?? 0);
  const lastBlockedAttempt = lastBlockedRows[0] ?? null;

  if (ipFailures < MAX_ATTEMPTS_PER_IP && emailFailures < MAX_ATTEMPTS_PER_EMAIL) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const maxFailures = Math.max(ipFailures, emailFailures);
  const blockMinutes = getBlockDurationMinutes(maxFailures);

  const blockedSince = lastBlockedAttempt?.createdAt ?? now;
  const releaseAt = new Date(blockedSince.getTime() + blockMinutes * 60 * 1000);
  const retryAfterMs = releaseAt.getTime() - now.getTime();

  if (retryAfterMs <= 0) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  };
}

export async function logLoginAttempt(params: {
  email?: string;
  ip: string;
  success: boolean;
  blocked?: boolean;
  reason?: string;
}): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "LoginAttempt" ("id", "email", "ip", "success", "blocked", "reason", "createdAt")
    VALUES (
      ${crypto.randomUUID()},
      ${params.email ?? null},
      ${params.ip},
      ${params.success},
      ${params.blocked ?? false},
      ${params.reason ?? null},
      ${new Date()}
    )
  `;
}
