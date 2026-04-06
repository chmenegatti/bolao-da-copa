import fs from "node:fs";
import Database from "better-sqlite3";
import { PrismaClient, Role } from "@prisma/client";

const sourcePath = process.env.LEGACY_SQLITE_PATH;
const targetUrl = process.env.DATABASE_URL;

if (!targetUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

if (!sourcePath) {
  console.log("LEGACY_SQLITE_PATH não informado. Pulando importação legada.");
  process.exit(0);
}

if (!fs.existsSync(sourcePath)) {
  console.log(`Banco SQLite legado não encontrado em ${sourcePath}. Pulando importação.`);
  process.exit(0);
}

const prisma = new PrismaClient({
  log: ["error"],
});

type Row = Record<string, unknown>;

type SQLiteDatabase = {
  prepare(sql: string): {
    get(...args: unknown[]): unknown;
    all(...args: unknown[]): Row[];
  };
  close(): void;
};

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function readTable(db: SQLiteDatabase, table: string): Row[] {
  const exists = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);

  if (!exists) return [];
  return db.prepare(`SELECT * FROM "${table}"`).all() as Row[];
}

async function main() {
  const targetCounts = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.guess.count(),
    prisma.goal.count(),
    prisma.topScorerBet.count(),
    prisma.championBet.count(),
    prisma.tournamentResult.count(),
    prisma.loginAttempt.count(),
  ]);

  if (targetCounts.some((count) => count > 0)) {
    console.log("Banco PostgreSQL já possui dados. Importação legada ignorada.");
    return;
  }

  const source = new Database(sourcePath, { readonly: true, fileMustExist: true });

  const users = readTable(source, "User").map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    password: String(row.password ?? ""),
    role: String(row.role ?? "USER") === "ADMIN" ? Role.ADMIN : Role.USER,
    totalPoints: toNumber(row.totalPoints),
    paymentConfirmed: toBoolean(row.paymentConfirmed),
    paymentConfirmedAt: toDate(row.paymentConfirmedAt),
    createdAt: toDate(row.createdAt) ?? new Date(),
  }));

  const matches = readTable(source, "Match").map((row) => ({
    id: String(row.id),
    teamA: String(row.teamA ?? ""),
    teamB: String(row.teamB ?? ""),
    datetime: toDate(row.datetime) ?? new Date(),
    groupStage: String(row.groupStage ?? ""),
    scoreA: row.scoreA === null || row.scoreA === undefined ? null : toNumber(row.scoreA),
    scoreB: row.scoreB === null || row.scoreB === undefined ? null : toNumber(row.scoreB),
    status: String(row.status ?? "SCHEDULED"),
    createdAt: toDate(row.createdAt) ?? new Date(),
  }));

  const goals = readTable(source, "Goal").map((row) => ({
    id: String(row.id),
    matchId: String(row.matchId ?? ""),
    team: String(row.team ?? ""),
    player: String(row.player ?? ""),
    minute: toNumber(row.minute),
  }));

  const guesses = readTable(source, "Guess").map((row) => ({
    id: String(row.id),
    userId: String(row.userId ?? ""),
    matchId: String(row.matchId ?? ""),
    guessA: toNumber(row.guessA),
    guessB: toNumber(row.guessB),
    pointsEarned: row.pointsEarned === null || row.pointsEarned === undefined ? null : toNumber(row.pointsEarned),
    createdAt: toDate(row.createdAt) ?? new Date(),
  }));

  const topScorerBets = readTable(source, "TopScorerBet").map((row) => ({
    id: String(row.id),
    userId: String(row.userId ?? ""),
    playerName: String(row.playerName ?? ""),
    totalGoals: toNumber(row.totalGoals),
    pointsEarned: row.pointsEarned === null || row.pointsEarned === undefined ? null : toNumber(row.pointsEarned),
  }));

  const championBets = readTable(source, "ChampionBet").map((row) => ({
    id: String(row.id),
    userId: String(row.userId ?? ""),
    champion: String(row.champion ?? ""),
    runnerUp: String(row.runnerUp ?? ""),
    finalScoreA: toNumber(row.finalScoreA),
    finalScoreB: toNumber(row.finalScoreB),
    pointsEarned: row.pointsEarned === null || row.pointsEarned === undefined ? null : toNumber(row.pointsEarned),
  }));

  const tournamentResults = readTable(source, "TournamentResult").map((row) => ({
    id: String(row.id),
    key: String(row.key ?? ""),
    topScorerName: row.topScorerName === null ? null : String(row.topScorerName),
    topScorerGoals: row.topScorerGoals === null || row.topScorerGoals === undefined ? null : toNumber(row.topScorerGoals),
    champion: row.champion === null ? null : String(row.champion),
    runnerUp: row.runnerUp === null ? null : String(row.runnerUp),
    finalScoreA: row.finalScoreA === null || row.finalScoreA === undefined ? null : toNumber(row.finalScoreA),
    finalScoreB: row.finalScoreB === null || row.finalScoreB === undefined ? null : toNumber(row.finalScoreB),
  }));

  const loginAttempts = readTable(source, "LoginAttempt").map((row) => ({
    id: String(row.id),
    email: row.email === null ? null : String(row.email),
    ip: String(row.ip ?? ""),
    success: toBoolean(row.success),
    blocked: toBoolean(row.blocked),
    reason: row.reason === null ? null : String(row.reason),
    createdAt: toDate(row.createdAt) ?? new Date(),
  }));

  await prisma.$transaction(async (tx) => {
    await tx.loginAttempt.deleteMany();
    await tx.goal.deleteMany();
    await tx.guess.deleteMany();
    await tx.topScorerBet.deleteMany();
    await tx.championBet.deleteMany();
    await tx.tournamentResult.deleteMany();
    await tx.match.deleteMany();
    await tx.user.deleteMany();

    if (users.length > 0) await tx.user.createMany({ data: users });
    if (matches.length > 0) await tx.match.createMany({ data: matches });
    if (goals.length > 0) await tx.goal.createMany({ data: goals });
    if (guesses.length > 0) await tx.guess.createMany({ data: guesses });
    if (topScorerBets.length > 0) await tx.topScorerBet.createMany({ data: topScorerBets });
    if (championBets.length > 0) await tx.championBet.createMany({ data: championBets });
    if (tournamentResults.length > 0) await tx.tournamentResult.createMany({ data: tournamentResults });
    if (loginAttempts.length > 0) await tx.loginAttempt.createMany({ data: loginAttempts });
  });

  source.close();

  console.log(
    `Importação concluída: ${users.length} users, ${matches.length} matches, ${goals.length} goals, ${guesses.length} guesses`
  );
}

main()
  .catch((error) => {
    console.error("Falha ao importar SQLite legado para Postgres:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });