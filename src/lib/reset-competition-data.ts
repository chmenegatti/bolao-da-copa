import { Prisma } from "@prisma/client";

export async function resetCompetitionData(
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