import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import { canUserPlaceGuess } from "@/lib/game-logic";
import SpecialBetsPanel from "@/components/SpecialBetsPanel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { PAYMENT_PENDING_MESSAGE } from "@/lib/payment";

export const dynamic = "force-dynamic";

export default async function SpecialBetsPage() {
  const user = await getRequiredUser();

  const [topScorerBet, championBet, topScorerResult, championResult, firstMatch] =
    await Promise.all([
      prisma.topScorerBet.findUnique({ where: { userId: user.id } }),
      prisma.championBet.findUnique({ where: { userId: user.id } }),
      prisma.tournamentResult.findUnique({ where: { key: "topScorer" } }),
      prisma.tournamentResult.findUnique({ where: { key: "champion" } }),
      prisma.match.findFirst({ orderBy: { datetime: "asc" }, select: { datetime: true } }),
    ]);

  const bettingOpen = firstMatch ? canUserPlaceGuess(firstMatch.datetime) : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Apostas Especiais</h1>
        <p className="text-muted-foreground mt-1">
          Aposte no artilheiro e no campeão da Copa do Mundo 2026
        </p>
      </div>
      {!user.paymentConfirmed && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5 bg-amber-600 text-white">
              <AlertCircle className="h-3 w-3" />
              Pagamento pendente
            </Badge>
            <p className="text-sm text-amber-950 dark:text-amber-200">
              {PAYMENT_PENDING_MESSAGE}
            </p>
          </div>
        </Card>
      )}
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
        bettingOpen={bettingOpen}
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
        canPlaceBets={user.paymentConfirmed}
      />
    </div>
  );
}
