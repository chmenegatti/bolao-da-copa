import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const prisma = new PrismaClient();
const SEED_MODE = process.env.SEED_MODE ?? "worldcup";
const DEFAULT_TEST_ADMIN_PASSWORD = "admin123";

type MatchSeed = {
  teamA: string;
  teamB: string;
  datetime: Date;
  groupStage: string;
};

async function resetCompetitionData(
  tx: Prisma.TransactionClient,
  options: { preserveMatches?: boolean } = {}
) {
  await tx.guess.deleteMany();
  await tx.goal.deleteMany();
  await tx.topScorerBet.deleteMany();
  await tx.championBet.deleteMany();
  await tx.tournamentResult.deleteMany();
  await tx.loginAttempt.deleteMany();
  if (!options.preserveMatches) {
    await tx.match.deleteMany();
  }
  await tx.user.updateMany({ data: { totalPoints: 0 } });
}

const adminPassword = process.env.ADMIN_PASS;

const adminPasswordValue = adminPassword ?? (SEED_MODE === "brasileirao-test" ? DEFAULT_TEST_ADMIN_PASSWORD : "");

if (!adminPasswordValue) {
  throw new Error("ADMIN_PASS environment variable is required");
}

async function seedAdminUser(adminPasswordValue: string) {
  const hashedPassword = await hash(adminPasswordValue, 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bolao.com" },
    update: {
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN",
      paymentConfirmed: true,
      paymentConfirmedAt: new Date(),
    },
    create: {
      name: "Administrador",
      email: "admin@bolao.com",
      password: hashedPassword,
      role: "ADMIN",
      paymentConfirmed: true,
      paymentConfirmedAt: new Date(),
    },
  });
  console.log("Admin criado:", admin.email);
}

function buildBrasileiraoTestMatches(): MatchSeed[] {
  return [
    { teamA: "São Paulo", teamB: "Cruzeiro", datetime: new Date("2026-04-04T18:30:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Coritiba", teamB: "Fluminense", datetime: new Date("2026-04-04T20:30:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Vasco da Gama", teamB: "Botafogo", datetime: new Date("2026-04-04T21:00:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Chapecoense", teamB: "Vitória", datetime: new Date("2026-04-05T16:00:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Atlético-MG", teamB: "Athletico-PR", datetime: new Date("2026-04-05T17:30:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Flamengo", teamB: "Santos", datetime: new Date("2026-04-05T17:30:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Bahia", teamB: "Palmeiras", datetime: new Date("2026-04-05T19:30:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Corinthians", teamB: "Internacional", datetime: new Date("2026-04-05T19:30:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Mirassol", teamB: "Bragantino", datetime: new Date("2026-04-05T20:00:00-03:00"), groupStage: "Rodada 10" },
    { teamA: "Grêmio", teamB: "Clube do Remo", datetime: new Date("2026-04-05T20:30:00-03:00"), groupStage: "Rodada 10" },

    { teamA: "Clube do Remo", teamB: "CR Vasco da Gama", datetime: new Date("2026-04-11T19:30:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "EC Vitória", teamB: "São Paulo FC", datetime: new Date("2026-04-11T19:30:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "Fluminense FC", teamB: "CR Flamengo", datetime: new Date("2026-04-11T21:30:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "Mirassol FC", teamB: "EC Bahia", datetime: new Date("2026-04-11T21:30:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "Santos FC", teamB: "CA Mineiro", datetime: new Date("2026-04-11T23:00:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "SC Internacional", teamB: "Grêmio FBPA", datetime: new Date("2026-04-11T23:30:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "CA Paranaense", teamB: "Chapecoense AF", datetime: new Date("2026-04-12T14:00:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "Botafogo FR", teamB: "Coritiba FBC", datetime: new Date("2026-04-12T19:00:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "SC Corinthians Paulista", teamB: "SE Palmeiras", datetime: new Date("2026-04-12T21:30:00.000Z"), groupStage: "Rodada 11" },
    { teamA: "Cruzeiro EC", teamB: "RB Bragantino", datetime: new Date("2026-04-12T21:30:00.000Z"), groupStage: "Rodada 11" },
  ];
}

async function seedBrasileiraoTest() {
  const matches = buildBrasileiraoTestMatches();

  await prisma.$transaction(async (tx) => {
    await resetCompetitionData(tx, { preserveMatches: false });
  });

  await seedAdminUser(adminPasswordValue);

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }

  console.log(`${matches.length} partidas de teste do Brasileirão 2026 criadas`);
}

async function seedWorldCup2026() {
  await prisma.$transaction(async (tx) => {
    await resetCompetitionData(tx, { preserveMatches: false });
  });

  await seedAdminUser(adminPasswordValue);

  // ============================================================
  // Copa do Mundo FIFA 2026 - Fase de Grupos (72 jogos oficiais)
  // Horários em UTC. Fontes: FIFA / Wikipedia
  // ============================================================
  const matches: MatchSeed[] = [
    // ==================== GRUPO A ====================
    // México, África do Sul, Coreia do Sul, Rep. Tcheca (Caminho D UEFA)
    // Rodada 1
    { teamA: "México", teamB: "África do Sul", datetime: new Date("2026-06-11T19:00:00Z"), groupStage: "Grupo A" },
    { teamA: "Coreia do Sul", teamB: "Rep. Tcheca", datetime: new Date("2026-06-12T02:00:00Z"), groupStage: "Grupo A" },
    // Rodada 2
    { teamA: "Rep. Tcheca", teamB: "África do Sul", datetime: new Date("2026-06-18T16:00:00Z"), groupStage: "Grupo A" },
    { teamA: "México", teamB: "Coreia do Sul", datetime: new Date("2026-06-19T01:00:00Z"), groupStage: "Grupo A" },
    // Rodada 3
    { teamA: "Rep. Tcheca", teamB: "México", datetime: new Date("2026-06-25T01:00:00Z"), groupStage: "Grupo A" },
    { teamA: "África do Sul", teamB: "Coreia do Sul", datetime: new Date("2026-06-25T01:00:00Z"), groupStage: "Grupo A" },

    // ==================== GRUPO B ====================
    // Canadá, Bósnia (Caminho A UEFA), Catar, Suíça
    // Rodada 1
    { teamA: "Canadá", teamB: "Bósnia", datetime: new Date("2026-06-12T19:00:00Z"), groupStage: "Grupo B" },
    { teamA: "Catar", teamB: "Suíça", datetime: new Date("2026-06-13T19:00:00Z"), groupStage: "Grupo B" },
    // Rodada 2
    { teamA: "Suíça", teamB: "Bósnia", datetime: new Date("2026-06-18T19:00:00Z"), groupStage: "Grupo B" },
    { teamA: "Canadá", teamB: "Catar", datetime: new Date("2026-06-18T22:00:00Z"), groupStage: "Grupo B" },
    // Rodada 3
    { teamA: "Suíça", teamB: "Canadá", datetime: new Date("2026-06-24T19:00:00Z"), groupStage: "Grupo B" },
    { teamA: "Bósnia", teamB: "Catar", datetime: new Date("2026-06-24T19:00:00Z"), groupStage: "Grupo B" },

    // ==================== GRUPO C ====================
    // Brasil, Marrocos, Haiti, Escócia
    // Todos os horários UTC-4 (EDT) → converter para UTC
    // Rodada 1
    { teamA: "Brasil", teamB: "Marrocos", datetime: new Date("2026-06-13T22:00:00Z"), groupStage: "Grupo C" },
    { teamA: "Haiti", teamB: "Escócia", datetime: new Date("2026-06-14T01:00:00Z"), groupStage: "Grupo C" },
    // Rodada 2
    { teamA: "Escócia", teamB: "Marrocos", datetime: new Date("2026-06-19T22:00:00Z"), groupStage: "Grupo C" },
    { teamA: "Brasil", teamB: "Haiti", datetime: new Date("2026-06-19T22:00:00Z"), groupStage: "Grupo C" },
    // Rodada 3
    { teamA: "Escócia", teamB: "Brasil", datetime: new Date("2026-06-24T22:00:00Z"), groupStage: "Grupo C" },
    { teamA: "Marrocos", teamB: "Haiti", datetime: new Date("2026-06-24T22:00:00Z"), groupStage: "Grupo C" },

    // ==================== GRUPO D ====================
    // EUA, Paraguai, Austrália, Turquia
    // Rodada 1
    { teamA: "Estados Unidos", teamB: "Paraguai", datetime: new Date("2026-06-13T01:00:00Z"), groupStage: "Grupo D" },
    { teamA: "Austrália", teamB: "Turquia", datetime: new Date("2026-06-13T04:00:00Z"), groupStage: "Grupo D" },
    // Rodada 2
    { teamA: "Estados Unidos", teamB: "Austrália", datetime: new Date("2026-06-19T19:00:00Z"), groupStage: "Grupo D" },
    { teamA: "Turquia", teamB: "Paraguai", datetime: new Date("2026-06-20T04:00:00Z"), groupStage: "Grupo D" },
    // Rodada 3
    { teamA: "Turquia", teamB: "Estados Unidos", datetime: new Date("2026-06-26T02:00:00Z"), groupStage: "Grupo D" },
    { teamA: "Paraguai", teamB: "Austrália", datetime: new Date("2026-06-26T02:00:00Z"), groupStage: "Grupo D" },

    // ==================== GRUPO E ====================
    // Alemanha, Curaçao, Costa do Marfim, Equador
    // Rodada 1
    { teamA: "Alemanha", teamB: "Curaçao", datetime: new Date("2026-06-14T17:00:00Z"), groupStage: "Grupo E" },
    { teamA: "Costa do Marfim", teamB: "Equador", datetime: new Date("2026-06-14T23:00:00Z"), groupStage: "Grupo E" },
    // Rodada 2
    { teamA: "Alemanha", teamB: "Costa do Marfim", datetime: new Date("2026-06-20T20:00:00Z"), groupStage: "Grupo E" },
    { teamA: "Equador", teamB: "Curaçao", datetime: new Date("2026-06-21T00:00:00Z"), groupStage: "Grupo E" },
    // Rodada 3
    { teamA: "Curaçao", teamB: "Costa do Marfim", datetime: new Date("2026-06-25T20:00:00Z"), groupStage: "Grupo E" },
    { teamA: "Equador", teamB: "Alemanha", datetime: new Date("2026-06-25T20:00:00Z"), groupStage: "Grupo E" },

    // ==================== GRUPO F ====================
    // Holanda, Japão, Suécia (Caminho B UEFA), Tunísia
    // Rodada 1
    { teamA: "Holanda", teamB: "Japão", datetime: new Date("2026-06-14T20:00:00Z"), groupStage: "Grupo F" },
    { teamA: "Suécia", teamB: "Tunísia", datetime: new Date("2026-06-15T02:00:00Z"), groupStage: "Grupo F" },
    // Rodada 2
    { teamA: "Holanda", teamB: "Suécia", datetime: new Date("2026-06-20T20:00:00Z"), groupStage: "Grupo F" },
    { teamA: "Tunísia", teamB: "Japão", datetime: new Date("2026-06-21T04:00:00Z"), groupStage: "Grupo F" },
    // Rodada 3
    { teamA: "Japão", teamB: "Suécia", datetime: new Date("2026-06-25T23:00:00Z"), groupStage: "Grupo F" },
    { teamA: "Tunísia", teamB: "Holanda", datetime: new Date("2026-06-25T23:00:00Z"), groupStage: "Grupo F" },

    // ==================== GRUPO G ====================
    // Bélgica, Egito, Irã, Nova Zelândia
    // Rodada 1
    { teamA: "Bélgica", teamB: "Egito", datetime: new Date("2026-06-15T19:00:00Z"), groupStage: "Grupo G" },
    { teamA: "Irã", teamB: "Nova Zelândia", datetime: new Date("2026-06-16T01:00:00Z"), groupStage: "Grupo G" },
    // Rodada 2
    { teamA: "Bélgica", teamB: "Irã", datetime: new Date("2026-06-21T19:00:00Z"), groupStage: "Grupo G" },
    { teamA: "Nova Zelândia", teamB: "Egito", datetime: new Date("2026-06-22T01:00:00Z"), groupStage: "Grupo G" },
    // Rodada 3
    { teamA: "Egito", teamB: "Irã", datetime: new Date("2026-06-27T03:00:00Z"), groupStage: "Grupo G" },
    { teamA: "Nova Zelândia", teamB: "Bélgica", datetime: new Date("2026-06-27T03:00:00Z"), groupStage: "Grupo G" },

    // ==================== GRUPO H ====================
    // Espanha, Cabo Verde, Arábia Saudita, Uruguai
    // Rodada 1
    { teamA: "Espanha", teamB: "Cabo Verde", datetime: new Date("2026-06-15T16:00:00Z"), groupStage: "Grupo H" },
    { teamA: "Arábia Saudita", teamB: "Uruguai", datetime: new Date("2026-06-15T22:00:00Z"), groupStage: "Grupo H" },
    // Rodada 2
    { teamA: "Espanha", teamB: "Arábia Saudita", datetime: new Date("2026-06-21T16:00:00Z"), groupStage: "Grupo H" },
    { teamA: "Uruguai", teamB: "Cabo Verde", datetime: new Date("2026-06-21T22:00:00Z"), groupStage: "Grupo H" },
    // Rodada 3
    { teamA: "Cabo Verde", teamB: "Arábia Saudita", datetime: new Date("2026-06-27T00:00:00Z"), groupStage: "Grupo H" },
    { teamA: "Uruguai", teamB: "Espanha", datetime: new Date("2026-06-27T00:00:00Z"), groupStage: "Grupo H" },

    // ==================== GRUPO I ====================
    // França, Senegal, Repescagem IC 2 (Iraque ou Bolívia), Noruega
    // Rodada 1
    { teamA: "França", teamB: "Senegal", datetime: new Date("2026-06-16T19:00:00Z"), groupStage: "Grupo I" },
    { teamA: "Repescagem IC 2", teamB: "Noruega", datetime: new Date("2026-06-16T22:00:00Z"), groupStage: "Grupo I" },
    // Rodada 2
    { teamA: "França", teamB: "Repescagem IC 2", datetime: new Date("2026-06-22T21:00:00Z"), groupStage: "Grupo I" },
    { teamA: "Noruega", teamB: "Senegal", datetime: new Date("2026-06-23T00:00:00Z"), groupStage: "Grupo I" },
    // Rodada 3
    { teamA: "Noruega", teamB: "França", datetime: new Date("2026-06-26T19:00:00Z"), groupStage: "Grupo I" },
    { teamA: "Senegal", teamB: "Repescagem IC 2", datetime: new Date("2026-06-26T19:00:00Z"), groupStage: "Grupo I" },

    // ==================== GRUPO J ====================
    // Argentina, Argélia, Áustria, Jordânia
    // Rodada 1
    { teamA: "Argentina", teamB: "Argélia", datetime: new Date("2026-06-17T01:00:00Z"), groupStage: "Grupo J" },
    { teamA: "Áustria", teamB: "Jordânia", datetime: new Date("2026-06-17T04:00:00Z"), groupStage: "Grupo J" },
    // Rodada 2
    { teamA: "Argentina", teamB: "Áustria", datetime: new Date("2026-06-22T17:00:00Z"), groupStage: "Grupo J" },
    { teamA: "Jordânia", teamB: "Argélia", datetime: new Date("2026-06-23T03:00:00Z"), groupStage: "Grupo J" },
    // Rodada 3
    { teamA: "Argélia", teamB: "Áustria", datetime: new Date("2026-06-28T02:00:00Z"), groupStage: "Grupo J" },
    { teamA: "Jordânia", teamB: "Argentina", datetime: new Date("2026-06-28T02:00:00Z"), groupStage: "Grupo J" },

    // ==================== GRUPO K ====================
    // Portugal, Repescagem IC 1 (RD Congo ou Jamaica), Uzbequistão, Colômbia
    // Rodada 1
    { teamA: "Portugal", teamB: "Repescagem IC 1", datetime: new Date("2026-06-17T17:00:00Z"), groupStage: "Grupo K" },
    { teamA: "Uzbequistão", teamB: "Colômbia", datetime: new Date("2026-06-18T02:00:00Z"), groupStage: "Grupo K" },
    // Rodada 2
    { teamA: "Portugal", teamB: "Uzbequistão", datetime: new Date("2026-06-23T17:00:00Z"), groupStage: "Grupo K" },
    { teamA: "Colômbia", teamB: "Repescagem IC 1", datetime: new Date("2026-06-24T02:00:00Z"), groupStage: "Grupo K" },
    // Rodada 3
    { teamA: "Colômbia", teamB: "Portugal", datetime: new Date("2026-06-27T23:30:00Z"), groupStage: "Grupo K" },
    { teamA: "Repescagem IC 1", teamB: "Uzbequistão", datetime: new Date("2026-06-27T23:30:00Z"), groupStage: "Grupo K" },

    // ==================== GRUPO L ====================
    // Inglaterra, Croácia, Gana, Panamá
    // Rodada 1
    { teamA: "Inglaterra", teamB: "Croácia", datetime: new Date("2026-06-17T20:00:00Z"), groupStage: "Grupo L" },
    { teamA: "Gana", teamB: "Panamá", datetime: new Date("2026-06-17T23:00:00Z"), groupStage: "Grupo L" },
    // Rodada 2
    { teamA: "Inglaterra", teamB: "Gana", datetime: new Date("2026-06-23T20:00:00Z"), groupStage: "Grupo L" },
    { teamA: "Panamá", teamB: "Croácia", datetime: new Date("2026-06-23T23:00:00Z"), groupStage: "Grupo L" },
    // Rodada 3
    { teamA: "Panamá", teamB: "Inglaterra", datetime: new Date("2026-06-27T21:00:00Z"), groupStage: "Grupo L" },
    { teamA: "Croácia", teamB: "Gana", datetime: new Date("2026-06-27T21:00:00Z"), groupStage: "Grupo L" },
  ];

  // Delete existing matches before seeding
  await prisma.guess.deleteMany();
  await prisma.match.deleteMany();

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }
  console.log(`${matches.length} partidas da Copa 2026 criadas`);
}

async function main() {
  if (SEED_MODE === "brasileirao-test") {
    await seedBrasileiraoTest();
    return;
  }

  if (SEED_MODE === "admin-only") {
    await seedAdminUser(adminPasswordValue);
    console.log("Apenas o admin foi criado/atualizado");
    return;
  }

  await seedWorldCup2026();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
