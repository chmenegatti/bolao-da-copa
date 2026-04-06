"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequiredUser, requireAdmin } from "@/lib/auth-helpers";
import { canUserPlaceGuess } from "@/lib/game-logic";
import { PAYMENT_PENDING_MESSAGE } from "@/lib/payment";
import { recalculateUsersTotalPoints } from "@/lib/points-recalculation";
import { revalidatePath } from "next/cache";

const MAX_SCORE = 30;
const MAX_GOALS = 20;
const MAX_PLAYER_NAME_LENGTH = 80;
const MAX_TEAM_NAME_LENGTH = 60;

async function assertSpecialBetsOpen() {
  const firstMatch = await prisma.match.findFirst({
    orderBy: { datetime: "asc" },
    select: { datetime: true },
  });
  if (!firstMatch || !canUserPlaceGuess(firstMatch.datetime)) {
    return "Prazo encerrado. As apostas especiais fecham 10 minutos antes do primeiro jogo.";
  }
  return null;
}

// ==================== Top Scorer Bet ====================

export async function saveTopScorerBet(playerName: string, totalGoals: number) {
  const user = await getRequiredUser();

  if (!user.paymentConfirmed) {
    return { error: PAYMENT_PENDING_MESSAGE };
  }

  const normalizedPlayerName = playerName.trim();

  if (!normalizedPlayerName) {
    return { error: "Informe o nome do jogador." };
  }
  if (normalizedPlayerName.length > MAX_PLAYER_NAME_LENGTH) {
    return { error: `Nome do jogador deve ter no máximo ${MAX_PLAYER_NAME_LENGTH} caracteres.` };
  }
  if (totalGoals < 0 || totalGoals > MAX_GOALS || !Number.isInteger(totalGoals)) {
    return { error: `Quantidade de gols deve ser um número inteiro entre 0 e ${MAX_GOALS}.` };
  }

  const windowError = await assertSpecialBetsOpen();
  if (windowError) return { error: windowError };

  try {
    const existing = await prisma.topScorerBet.findUnique({ where: { userId: user.id } });
    if (existing) {
      return { error: "Você já registrou sua aposta de artilheiro. Esta aposta é única e não pode ser alterada." };
    }

    await prisma.topScorerBet.create({
      data: { userId: user.id, playerName: normalizedPlayerName, totalGoals },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Você já registrou sua aposta de artilheiro. Esta aposta é única e não pode ser alterada." };
    }
    throw error;
  }

  revalidatePath("/special-bets");
  revalidatePath("/my-bets");
  return { success: true };
}

// ==================== Champion Bet ====================

export async function saveChampionBet(
  champion: string,
  runnerUp: string,
  finalScoreA: number,
  finalScoreB: number
) {
  const user = await getRequiredUser();

  if (!user.paymentConfirmed) {
    return { error: PAYMENT_PENDING_MESSAGE };
  }

  const normalizedChampion = champion.trim();
  const normalizedRunnerUp = runnerUp.trim();

  if (!normalizedChampion || !normalizedRunnerUp) {
    return { error: "Informe campeão e vice." };
  }
  if (
    normalizedChampion.length > MAX_TEAM_NAME_LENGTH ||
    normalizedRunnerUp.length > MAX_TEAM_NAME_LENGTH
  ) {
    return { error: `Campeão e vice devem ter no máximo ${MAX_TEAM_NAME_LENGTH} caracteres.` };
  }
  if (normalizedChampion.toLowerCase() === normalizedRunnerUp.toLowerCase()) {
    return { error: "Campeão e vice devem ser diferentes." };
  }
  if (
    finalScoreA < 0 ||
    finalScoreB < 0 ||
    finalScoreA > MAX_SCORE ||
    finalScoreB > MAX_SCORE ||
    !Number.isInteger(finalScoreA) ||
    !Number.isInteger(finalScoreB)
  ) {
    return { error: `Placar deve ser números inteiros entre 0 e ${MAX_SCORE}.` };
  }

  const windowError = await assertSpecialBetsOpen();
  if (windowError) return { error: windowError };

  try {
    const existing = await prisma.championBet.findUnique({ where: { userId: user.id } });
    if (existing) {
      return { error: "Você já registrou sua aposta de campeão. Esta aposta é única e não pode ser alterada." };
    }

    await prisma.championBet.create({
      data: {
        userId: user.id,
        champion: normalizedChampion,
        runnerUp: normalizedRunnerUp,
        finalScoreA,
        finalScoreB,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Você já registrou sua aposta de campeão. Esta aposta é única e não pode ser alterada." };
    }
    throw error;
  }

  revalidatePath("/special-bets");
  revalidatePath("/my-bets");
  return { success: true };
}

// ==================== Admin: Set Tournament Results ====================

export async function setTopScorerResult(playerName: string, totalGoals: number) {
  await requireAdmin();
  const normalizedPlayerName = playerName.trim();

  if (!normalizedPlayerName) return { error: "Informe o nome do artilheiro." };
  if (normalizedPlayerName.length > MAX_PLAYER_NAME_LENGTH) {
    return { error: `Nome do artilheiro deve ter no máximo ${MAX_PLAYER_NAME_LENGTH} caracteres.` };
  }
  if (totalGoals < 0 || totalGoals > MAX_GOALS || !Number.isInteger(totalGoals)) {
    return { error: `Gols devem ser um número inteiro entre 0 e ${MAX_GOALS}.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournamentResult.upsert({
      where: { key: "topScorer" },
      update: { topScorerName: normalizedPlayerName, topScorerGoals: totalGoals },
      create: { key: "topScorer", topScorerName: normalizedPlayerName, topScorerGoals: totalGoals },
    });

    // Calculate points for all bets
    const bets = await tx.topScorerBet.findMany();
    for (const bet of bets) {
      let points = 0;
      const nameMatch = bet.playerName.trim().toLowerCase() === normalizedPlayerName.toLowerCase();
      if (nameMatch && bet.totalGoals === totalGoals) {
        points = 35;
      } else if (nameMatch) {
        points = 20;
      }
      await tx.topScorerBet.update({
        where: { id: bet.id },
        data: { pointsEarned: points },
      });
    }

    await recalculateUsersTotalPoints(tx, bets.map((b) => b.userId));
  });

  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/admin");
  revalidatePath("/special-bets");
  return { success: true };
}

export async function setChampionResult(
  champion: string,
  runnerUp: string,
  finalScoreA: number,
  finalScoreB: number
) {
  await requireAdmin();
  const normalizedChampion = champion.trim();
  const normalizedRunnerUp = runnerUp.trim();

  if (!normalizedChampion || !normalizedRunnerUp) return { error: "Informe campeão e vice." };
  if (
    normalizedChampion.length > MAX_TEAM_NAME_LENGTH ||
    normalizedRunnerUp.length > MAX_TEAM_NAME_LENGTH
  ) {
    return { error: `Campeão e vice devem ter no máximo ${MAX_TEAM_NAME_LENGTH} caracteres.` };
  }
  if (normalizedChampion.toLowerCase() === normalizedRunnerUp.toLowerCase()) {
    return { error: "Campeão e vice devem ser diferentes." };
  }
  if (
    finalScoreA < 0 ||
    finalScoreB < 0 ||
    finalScoreA > MAX_SCORE ||
    finalScoreB > MAX_SCORE ||
    !Number.isInteger(finalScoreA) ||
    !Number.isInteger(finalScoreB)
  ) {
    return { error: `Placar da final deve ser números inteiros entre 0 e ${MAX_SCORE}.` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournamentResult.upsert({
      where: { key: "champion" },
      update: {
        champion: normalizedChampion,
        runnerUp: normalizedRunnerUp,
        finalScoreA,
        finalScoreB,
      },
      create: {
        key: "champion",
        champion: normalizedChampion,
        runnerUp: normalizedRunnerUp,
        finalScoreA,
        finalScoreB,
      },
    });

    // Calculate points for all bets
    const bets = await tx.championBet.findMany();
    for (const bet of bets) {
      let points = 0;
      const champMatch = bet.champion.trim().toLowerCase() === normalizedChampion.toLowerCase();
      const viceMatch = bet.runnerUp.trim().toLowerCase() === normalizedRunnerUp.toLowerCase();
      const scoreMatch = bet.finalScoreA === finalScoreA && bet.finalScoreB === finalScoreB;

      if (champMatch && scoreMatch && viceMatch) {
        points = 90;
      } else if (champMatch && scoreMatch) {
        points = 70;
      } else if (champMatch) {
        points = 50;
      }
      await tx.championBet.update({
        where: { id: bet.id },
        data: { pointsEarned: points },
      });
    }

    await recalculateUsersTotalPoints(tx, bets.map((b) => b.userId));
  });

  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/admin");
  revalidatePath("/special-bets");
  return { success: true };
}
