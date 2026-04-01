"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser, requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

// ==================== Top Scorer Bet ====================

export async function saveTopScorerBet(playerName: string, totalGoals: number) {
  const user = await getRequiredUser();

  if (!playerName.trim()) {
    return { error: "Informe o nome do jogador." };
  }
  if (totalGoals < 0 || !Number.isInteger(totalGoals)) {
    return { error: "Quantidade de gols deve ser um número inteiro ≥ 0." };
  }

  // Check if tournament result is already set (betting closed)
  const result = await prisma.tournamentResult.findUnique({ where: { key: "topScorer" } });
  if (result?.topScorerName) {
    return { error: "As apostas de artilheiro já foram encerradas." };
  }

  await prisma.topScorerBet.upsert({
    where: { userId: user.id },
    update: { playerName: playerName.trim(), totalGoals },
    create: { userId: user.id, playerName: playerName.trim(), totalGoals },
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

  // Check if tournament result is already set (betting closed)
  const result = await prisma.tournamentResult.findUnique({ where: { key: "champion" } });
  if (result?.champion) {
    return { error: "As apostas de campeão já foram encerradas." };
  }

  await prisma.championBet.upsert({
    where: { userId: user.id },
    update: {
      champion: champion.trim(),
      runnerUp: runnerUp.trim(),
      finalScoreA,
      finalScoreB,
    },
    create: {
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
