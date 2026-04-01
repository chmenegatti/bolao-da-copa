"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { calculatePoints } from "@/lib/scoring";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export async function finishMatch(
  matchId: string,
  scoreA: number,
  scoreB: number,
  goals: { team: string; player: string; minute: number }[]
) {
  await requireAdmin();

  if (scoreA < 0 || scoreB < 0 || !Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
    return { error: "Placares devem ser números inteiros ≥ 0." };
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
        data: goals.map((g) => ({ matchId, team: g.team, player: g.player, minute: g.minute })),
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

    const userIds = [...new Set(guesses.map((g) => g.userId))];
    for (const userId of userIds) {
      const matchPoints = await tx.guess.aggregate({
        where: { userId, pointsEarned: { not: null } },
        _sum: { pointsEarned: true },
      });
      const tsPoints = await tx.topScorerBet.findUnique({ where: { userId } });
      const chPoints = await tx.championBet.findUnique({ where: { userId } });
      const total =
        (matchPoints._sum.pointsEarned ?? 0) +
        (tsPoints?.pointsEarned ?? 0) +
        (chPoints?.pointsEarned ?? 0);
      await tx.user.update({
        where: { id: userId },
        data: { totalPoints: total },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/admin");
  return { success: true };
}

export async function createMatch(formData: FormData) {
  await requireAdmin();

  const teamA = formData.get("teamA") as string;
  const teamB = formData.get("teamB") as string;
  const datetime = formData.get("datetime") as string;
  const groupStage = formData.get("groupStage") as string;

  if (!teamA || !teamB || !datetime || !groupStage) {
    return { error: "Preencha todos os campos." };
  }

  await prisma.match.create({
    data: {
      teamA,
      teamB,
      datetime: new Date(datetime),
      groupStage,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateMatch(matchId: string, formData: FormData) {
  await requireAdmin();

  const teamA = formData.get("teamA") as string;
  const teamB = formData.get("teamB") as string;
  const datetime = formData.get("datetime") as string;
  const groupStage = formData.get("groupStage") as string;

  if (!teamA || !teamB || !datetime || !groupStage) {
    return { error: "Preencha todos os campos." };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partida não encontrada." };
  if (match.status === "FINISHED") return { error: "Não é possível editar partida finalizada." };

  await prisma.match.update({
    where: { id: matchId },
    data: { teamA, teamB, datetime: new Date(datetime), groupStage },
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

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "USER";

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email já cadastrado." };
  }

  const hashed = await hash(password, 12);
  await prisma.user.create({
    data: { name, email, password: hashed, role },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUser(userId: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !role) {
    return { error: "Preencha nome, email e papel." };
  }

  const existing = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (existing) {
    return { error: "Email já em uso por outro usuário." };
  }

  const data: { name: string; email: string; role: string; password?: string } = { name, email, role };
  if (password && password.length > 0) {
    if (password.length < 6) return { error: "Senha deve ter pelo menos 6 caracteres." };
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
