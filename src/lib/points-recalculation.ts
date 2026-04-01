import { Prisma } from "@prisma/client";

export async function recalculateUsersTotalPoints(
  tx: Prisma.TransactionClient,
  userIds: string[]
): Promise<void> {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) {
    return;
  }

  const [matchPointRows, topScorerRows, championRows] = await Promise.all([
    tx.guess.groupBy({
      by: ["userId"],
      where: {
        userId: { in: uniqueUserIds },
        pointsEarned: { not: null },
      },
      _sum: { pointsEarned: true },
    }),
    tx.topScorerBet.findMany({
      where: { userId: { in: uniqueUserIds } },
      select: { userId: true, pointsEarned: true },
    }),
    tx.championBet.findMany({
      where: { userId: { in: uniqueUserIds } },
      select: { userId: true, pointsEarned: true },
    }),
  ]);

  const matchPointsByUser = new Map(
    matchPointRows.map((row) => [row.userId, row._sum.pointsEarned ?? 0])
  );
  const topScorerPointsByUser = new Map(
    topScorerRows.map((row) => [row.userId, row.pointsEarned ?? 0])
  );
  const championPointsByUser = new Map(
    championRows.map((row) => [row.userId, row.pointsEarned ?? 0])
  );

  await Promise.all(
    uniqueUserIds.map((userId) =>
      tx.user.update({
        where: { id: userId },
        data: {
          totalPoints:
            (matchPointsByUser.get(userId) ?? 0) +
            (topScorerPointsByUser.get(userId) ?? 0) +
            (championPointsByUser.get(userId) ?? 0),
        },
      })
    )
  );
}
