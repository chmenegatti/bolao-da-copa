import { Prisma } from "@prisma/client";

export async function resetCompetitionData(tx: Prisma.TransactionClient) {
  await tx.guess.deleteMany();
  await tx.goal.deleteMany();
  await tx.topScorerBet.deleteMany();
  await tx.championBet.deleteMany();
  await tx.tournamentResult.deleteMany();
  await tx.loginAttempt.deleteMany();
  await tx.match.deleteMany();
  await tx.user.updateMany({ data: { totalPoints: 0 } });
}