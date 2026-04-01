import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, XCircle, Trophy, Crown, Crosshair } from "lucide-react";
import { formatMatchDate, formatMatchTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function MyBetsPage() {
  const user = await getRequiredUser();

  const [guesses, profile, topScorerBet, championBet] = await Promise.all([
    prisma.guess.findMany({
      where: { userId: user.id },
      include: { match: true },
      orderBy: { match: { datetime: "asc" } },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { totalPoints: true },
    }),
    prisma.topScorerBet.findUnique({ where: { userId: user.id } }),
    prisma.championBet.findUnique({ where: { userId: user.id } }),
  ]);

  const totalPoints = profile?.totalPoints ?? 0;
  const matchPoints = guesses.reduce((acc, g) => acc + (g.pointsEarned ?? 0), 0);
  const specialPoints = (topScorerBet?.pointsEarned ?? 0) + (championBet?.pointsEarned ?? 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Meus Palpites</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe seus palpites e sua pontuação
        </p>
      </div>

      {/* Points summary */}
      <Card className="p-6 mb-8 gradient-hero text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Pontuação Total</p>
            <p className="font-display text-4xl font-bold mt-1">
              {totalPoints}
            </p>
            <div className="flex gap-4 text-sm text-white/70 mt-1">
              <span>Partidas: {matchPoints}</span>
              {specialPoints > 0 && <span>Especiais: {specialPoints}</span>}
            </div>
          </div>
          <Trophy className="h-16 w-16 text-gold opacity-80" />
        </div>
      </Card>

      {/* Special bets */}
      {(topScorerBet || championBet) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {topScorerBet && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" />
                  <span className="font-display font-semibold text-sm">Artilheiro</span>
                </div>
                {topScorerBet.pointsEarned !== null && (
                  <Badge className={topScorerBet.pointsEarned > 0 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                    +{topScorerBet.pointsEarned} pts
                  </Badge>
                )}
              </div>
              <p className="text-lg font-bold">{topScorerBet.playerName}</p>
              <p className="text-sm text-muted-foreground">{topScorerBet.totalGoals} gols</p>
            </Card>
          )}
          {championBet && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-display font-semibold text-sm">Campeão</span>
                </div>
                {championBet.pointsEarned !== null && (
                  <Badge className={championBet.pointsEarned! > 0 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                    +{championBet.pointsEarned} pts
                  </Badge>
                )}
              </div>
              <p className="text-lg font-bold">{championBet.champion}</p>
              <p className="text-sm text-muted-foreground">
                Vice: {championBet.runnerUp} • Final: {championBet.finalScoreA} × {championBet.finalScoreB}
              </p>
            </Card>
          )}
        </div>
      )}

      {guesses.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Você ainda não fez nenhum palpite. Vá para a página de Jogos!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {guesses.map((guess) => {
            const game = guess.match;
            const isExact = guess.pointsEarned === 25;
            const isPartial = (guess.pointsEarned ?? 0) > 0;

            return (
              <Card key={guess.id} className="p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      {game.groupStage}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatMatchDate(game.datetime, "dd MMM")} •{" "}
                      {formatMatchTime(game.datetime)}
                    </span>
                  </div>
                  {guess.pointsEarned !== null && (
                    <Badge
                      className={
                        isExact
                          ? "bg-success text-success-foreground"
                          : isPartial
                            ? "bg-warning text-warning-foreground"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {isExact ? (
                        <Target className="h-3 w-3 mr-1" />
                      ) : !isPartial ? (
                        <XCircle className="h-3 w-3 mr-1" />
                      ) : null}
                      +{guess.pointsEarned} pts
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-display font-semibold">
                      {game.teamA} vs {game.teamB}
                    </p>
                    {game.status === "FINISHED" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Resultado: {game.scoreA} × {game.scoreB}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Seu palpite</p>
                    <p className="font-display text-xl font-bold">
                      {guess.guessA}{" "}
                      <span className="text-muted-foreground">×</span>{" "}
                      {guess.guessB}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
