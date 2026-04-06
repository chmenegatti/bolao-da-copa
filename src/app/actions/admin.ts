"use server";

import { Prisma, Role } from "@prisma/client";
import { execFile } from "node:child_process";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { calculatePoints } from "@/lib/scoring";
import { recalculateUsersTotalPoints } from "@/lib/points-recalculation";
import { resetCompetitionData } from "@/lib/reset-competition-data";
import { parseMatchDateTimeInput } from "@/lib/timezone";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = [Role.USER, Role.ADMIN] as const;
const MAX_SCORE = 30;
const MAX_GOAL_MINUTE = 130;
const MAX_TEAM_NAME_LENGTH = 60;
const MAX_PLAYER_NAME_LENGTH = 80;

function isAllowedRole(role: string): role is Role {
  return ALLOWED_ROLES.includes(role as Role);
}

export async function finishMatch(
  matchId: string,
  scoreA: number,
  scoreB: number,
  goals: { team: string; player: string; minute: number }[]
) {
  await requireAdmin();

  if (
    scoreA < 0 ||
    scoreB < 0 ||
    scoreA > MAX_SCORE ||
    scoreB > MAX_SCORE ||
    !Number.isInteger(scoreA) ||
    !Number.isInteger(scoreB)
  ) {
    return { error: `Placares devem ser números inteiros entre 0 e ${MAX_SCORE}.` };
  }

  for (const goal of goals) {
    const normalizedPlayer = goal.player?.trim() ?? "";
    if ((goal.team !== "A" && goal.team !== "B") || !normalizedPlayer) {
      return { error: "Cada gol deve ter time válido (A/B) e nome do jogador." };
    }
    if (normalizedPlayer.length > MAX_PLAYER_NAME_LENGTH) {
      return { error: `Nome do jogador deve ter no máximo ${MAX_PLAYER_NAME_LENGTH} caracteres.` };
    }
    if (
      !Number.isInteger(goal.minute) ||
      goal.minute < 1 ||
      goal.minute > MAX_GOAL_MINUTE
    ) {
      return { error: `Minuto do gol deve ser um inteiro entre 1 e ${MAX_GOAL_MINUTE}.` };
    }
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return { error: "Partida não encontrada." };
  }

  if (match.status === "FINISHED") {
    return { error: "Esta partida já foi finalizada." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { scoreA, scoreB, status: "FINISHED" },
    });

    // Save goals
    if (goals.length > 0) {
      await tx.goal.createMany({
        data: goals.map((g) => ({
          matchId,
          team: g.team,
          player: g.player.trim(),
          minute: g.minute,
        })),
      });
    }

    const guesses = await tx.guess.findMany({ where: { matchId } });

    for (const guess of guesses) {
      const points = calculatePoints(guess.guessA, guess.guessB, scoreA, scoreB);
      await tx.guess.update({
        where: { id: guess.id },
        data: { pointsEarned: points },
      });
    }

    await recalculateUsersTotalPoints(tx, guesses.map((g) => g.userId));
  });

  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/admin");
  return { success: true };
}

export async function createMatch(formData: FormData) {
  await requireAdmin();

  const teamA = (formData.get("teamA") as string | null)?.trim() ?? "";
  const teamB = (formData.get("teamB") as string | null)?.trim() ?? "";
  const datetime = (formData.get("datetime") as string | null)?.trim() ?? "";
  const groupStage = (formData.get("groupStage") as string | null)?.trim() ?? "";

  if (!teamA || !teamB || !datetime || !groupStage) {
    return { error: "Preencha todos os campos." };
  }

  if (teamA.length > MAX_TEAM_NAME_LENGTH || teamB.length > MAX_TEAM_NAME_LENGTH) {
    return { error: `Nome dos times deve ter no máximo ${MAX_TEAM_NAME_LENGTH} caracteres.` };
  }

  const parsedDatetime = parseMatchDateTimeInput(datetime);
  if (Number.isNaN(parsedDatetime.getTime())) {
    return { error: "Data/hora inválida." };
  }

  await prisma.match.create({
    data: {
      teamA,
      teamB,
      datetime: parsedDatetime,
      groupStage,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateMatch(matchId: string, formData: FormData) {
  await requireAdmin();

  const teamA = (formData.get("teamA") as string | null)?.trim() ?? "";
  const teamB = (formData.get("teamB") as string | null)?.trim() ?? "";
  const datetime = (formData.get("datetime") as string | null)?.trim() ?? "";
  const groupStage = (formData.get("groupStage") as string | null)?.trim() ?? "";

  if (!teamA || !teamB || !datetime || !groupStage) {
    return { error: "Preencha todos os campos." };
  }

  if (teamA.length > MAX_TEAM_NAME_LENGTH || teamB.length > MAX_TEAM_NAME_LENGTH) {
    return { error: `Nome dos times deve ter no máximo ${MAX_TEAM_NAME_LENGTH} caracteres.` };
  }

  const parsedDatetime = parseMatchDateTimeInput(datetime);
  if (Number.isNaN(parsedDatetime.getTime())) {
    return { error: "Data/hora inválida." };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partida não encontrada." };
  if (match.status === "FINISHED") return { error: "Não é possível editar partida finalizada." };

  await prisma.match.update({
    where: { id: matchId },
    data: { teamA, teamB, datetime: parsedDatetime, groupStage },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteMatch(matchId: string) {
  await requireAdmin();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { _count: { select: { guesses: true } } },
  });

  if (!match) {
    return { error: "Partida não encontrada." };
  }

  if (match.status === "FINISHED") {
    return { error: "Não é possível excluir uma partida finalizada." };
  }

  await prisma.match.delete({ where: { id: matchId } });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// ==================== User CRUD ====================

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, totalPoints: true, createdAt: true },
  });
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";
  const role = ((formData.get("role") as string | null)?.trim() ?? Role.USER).toUpperCase();

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Informe um email válido." };
  }
  if (!isAllowedRole(role)) {
    return { error: "Papel inválido." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Email já cadastrado." };
    }

    const hashed = await hash(password, 12);
    await prisma.user.create({
      data: { name, email, password: hashed, role },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Email já cadastrado." };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUser(userId: string, formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const role = ((formData.get("role") as string | null)?.trim() ?? "").toUpperCase();
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!name || !email || !role) {
    return { error: "Preencha nome, email e papel." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Informe um email válido." };
  }
  if (!isAllowedRole(role)) {
    return { error: "Papel inválido." };
  }

  const existing = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (existing) {
    return { error: "Email já em uso por outro usuário." };
  }

  const data: Prisma.UserUpdateInput = { name, email, role };
  if (password && password.length > 0) {
    if (password.length < 6) return { error: "Senha deve ter pelo menos 6 caracteres." };
    if (password !== confirmPassword) return { error: "As senhas não coincidem." };
    data.password = await hash(password, 12);
  }

  await prisma.user.update({ where: { id: userId }, data });

  revalidatePath("/admin");
  revalidatePath("/ranking");
  return { success: true };
}

export async function deleteUser(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuário não encontrado." };
  if (user.role === "ADMIN") return { error: "Não é possível excluir um administrador." };

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin");
  revalidatePath("/ranking");
  return { success: true };
}

export async function setUserPaymentStatus(userId: string, paymentConfirmed: boolean) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      paymentConfirmed,
      paymentConfirmedAt: paymentConfirmed ? new Date() : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/finance");
  revalidatePath("/jogos");
  revalidatePath("/special-bets");
  revalidatePath("/my-bets");
  return { success: true };
}

export async function resetTournamentData() {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    await resetCompetitionData(tx);
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/special-bets");
  return { success: true };
}

type SeedMode = "worldcup" | "brasileirao-test";

async function runSeed(mode: SeedMode) {
  await requireAdmin();

  if (!process.env.ADMIN_PASS) {
    return { error: "ADMIN_PASS precisa estar definido no ambiente de deploy." };
  }

  try {
    await execFileAsync("npm", ["run", "-s", `prisma:seed:${mode}`], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SEED_MODE: mode,
      },
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao executar o seed.";
    return { error: message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/special-bets");
  return { success: true };
}

export async function seedWorldCupData() {
  return runSeed("worldcup");
}

export async function seedBrasileiraoTestData() {
  return runSeed("brasileirao-test");
}
