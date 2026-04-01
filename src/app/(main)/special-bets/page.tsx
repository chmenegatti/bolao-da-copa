import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import SpecialBetsPanel from "@/components/SpecialBetsPanel";

export default async function SpecialBetsPage() {
  const user = await getRequiredUser();

  const [topScorerBet, championBet, topScorerResult, championResult] =
    await Promise.all([
      prisma.topScorerBet.findUnique({ where: { userId: user.id } }),
      prisma.championBet.findUnique({ where: { userId: user.id } }),
      prisma.tournamentResult.findUnique({ where: { key: "topScorer" } }),
      prisma.tournamentResult.findUnique({ where: { key: "champion" } }),
    ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Apostas Especiais</h1>
        <p className="text-muted-foreground mt-1">
          Aposte no artilheiro e no campeão da Copa do Mundo 2026
        </p>
      </div>
      <SpecialBetsPanel
        topScorerBet={
          topScorerBet
            ? {
              playerName: topScorerBet.playerName,
              totalGoals: topScorerBet.totalGoals,
              pointsEarned: topScorerBet.pointsEarned,
            }
            : null
        }
        championBet={
          championBet
            ? {
              champion: championBet.champion,
              runnerUp: championBet.runnerUp,
              finalScoreA: championBet.finalScoreA,
              finalScoreB: championBet.finalScoreB,
              pointsEarned: championBet.pointsEarned,
            }
            : null
        }
        topScorerClosed={!!topScorerResult?.topScorerName}
        championClosed={!!championResult?.champion}
        topScorerResult={
          topScorerResult?.topScorerName
            ? {
              playerName: topScorerResult.topScorerName,
              totalGoals: topScorerResult.topScorerGoals!,
            }
            : null
        }
        championResultData={
          championResult?.champion
            ? {
              champion: championResult.champion,
              runnerUp: championResult.runnerUp!,
              finalScoreA: championResult.finalScoreA!,
              finalScoreB: championResult.finalScoreB!,
            }
            : null
        }
      />
    </div>
  );
}
