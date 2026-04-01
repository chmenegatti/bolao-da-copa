"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser, requireAdmin } from "@/lib/auth-helpers";
import { canUserPlaceGuess } from "@/lib/game-logic";
import { revalidatePath } from "next/cache";

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

  if (!playerName.trim()) {
    return { error: "Informe o nome do jogador." };
  }
  if (totalGoals < 0 || !Number.isInteger(totalGoals)) {
    return { error: "Quantidade de gols deve ser um número inteiro ≥ 0." };
  }

  const windowError = await assertSpecialBetsOpen();
  if (windowError) return { error: windowError };

  const existing = await prisma.topScorerBet.findUnique({ where: { userId: user.id } });
  if (existing) {
    return { error: "Você já registrou sua aposta de artilheiro. Esta aposta é única e não pode ser alterada." };
  }

  await prisma.topScorerBet.create({
    data: { userId: user.id, playerName: playerName.trim(), totalGoals },
  });

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

  if (!champion.trim() || !runnerUp.trim()) {
    return { error: "Informe campeão e vice." };
  }
  if (champion.trim().toLowerCase() === runnerUp.trim().toLowerCase()) {
    return { error: "Campeão e vice devem ser diferentes." };
  }
  if (finalScoreA < 0 || finalScoreB < 0 || !Number.isInteger(finalScoreA) || !Number.isInteger(finalScoreB)) {
    return { error: "Placar deve ser números inteiros ≥ 0." };
  }

  const windowError = await assertSpecialBetsOpen();
  if (windowError) return { error: windowError };

  const existing = await prisma.championBet.findUnique({ where: { userId: user.id } });
  if (existing) {
    return { error: "Você já registrou sua aposta de campeão. Esta aposta é única e não pode ser alterada." };
  }

  await prisma.championBet.create({
    data: {
      userId: user.id,
      champion: champion.trim(),
      runnerUp: runnerUp.trim(),
      finalScoreA,
      finalScoreB,
    },
  });

  revalidatePath("/special-bets");
  revalidatePath("/my-bets");
  return { success: true };
}

// ==================== Admin: Set Tournament Results ====================

export async function setTopScorerResult(playerName: string, totalGoals: number) {
  await requireAdmin();

  if (!playerName.trim()) return { error: "Informe o nome do artilheiro." };
  if (totalGoals < 0 || !Number.isInteger(totalGoals)) return { error: "Gols inválidos." };

  await prisma.$transaction(async (tx) => {
    await tx.tournamentResult.upsert({
      where: { key: "topScorer" },
      update: { topScorerName: playerName.trim(), topScorerGoals: totalGoals },
      create: { key: "topScorer", topScorerName: playerName.trim(), topScorerGoals: totalGoals },
    });

    // Calculate points for all bets
    const bets = await tx.topScorerBet.findMany();
    for (const bet of bets) {
      let points = 0;
      const nameMatch = bet.playerName.trim().toLowerCase() === playerName.trim().toLowerCase();
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

    // Recalculate totalPoints for all users who have bets
    const userIds = bets.map((b) => b.userId);
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
      await tx.user.update({ where: { id: userId }, data: { totalPoints: total } });
    }
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

  if (!champion.trim() || !runnerUp.trim()) return { error: "Informe campeão e vice." };

  await prisma.$transaction(async (tx) => {
    await tx.tournamentResult.upsert({
      where: { key: "champion" },
      update: {
        champion: champion.trim(),
        runnerUp: runnerUp.trim(),
        finalScoreA,
        finalScoreB,
      },
      create: {
        key: "champion",
        champion: champion.trim(),
        runnerUp: runnerUp.trim(),
        finalScoreA,
        finalScoreB,
      },
    });

    // Calculate points for all bets
    const bets = await tx.championBet.findMany();
    for (const bet of bets) {
      let points = 0;
      const champMatch = bet.champion.trim().toLowerCase() === champion.trim().toLowerCase();
      const viceMatch = bet.runnerUp.trim().toLowerCase() === runnerUp.trim().toLowerCase();
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

    // Recalculate totalPoints for all users who have bets
    const userIds = bets.map((b) => b.userId);
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
      await tx.user.update({ where: { id: userId }, data: { totalPoints: total } });
    }
  });

  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/admin");
  revalidatePath("/special-bets");
  return { success: true };
}
