import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import GamesList from "@/components/GamesList";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { PAYMENT_PENDING_MESSAGE } from "@/lib/payment";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const user = await getRequiredUser();

  const [matches, guesses] = await Promise.all([
    prisma.match.findMany({
      orderBy: { datetime: "asc" },
    }),
    prisma.guess.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ matchId: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const serializedMatches = matches.map((m) => ({
    id: m.id,
    teamA: m.teamA,
    teamB: m.teamB,
    datetime: m.datetime.toISOString(),
    groupStage: m.groupStage,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    status: m.status,
  }));

  const userGuesses = guesses
    .filter((g) => g.userId === user.id)
    .map((g) => ({
      id: g.id,
      userId: g.userId,
      matchId: g.matchId,
      guessA: g.guessA,
      guessB: g.guessB,
      pointsEarned: g.pointsEarned,
    }));

  const opponentGuesses = guesses
    .filter((g) => g.userId !== user.id)
    .map((g) => ({
      id: g.id,
      userId: g.userId,
      userName: g.user.name,
      matchId: g.matchId,
      guessA: g.guessA,
      guessB: g.guessB,
      pointsEarned: g.pointsEarned,
    }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Jogos</h1>
        <p className="text-muted-foreground mt-1">
          Faça seus palpites antes do início de cada partida
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
      <GamesList
        matches={serializedMatches}
        guesses={userGuesses}
        opponentGuesses={opponentGuesses}
        canPlaceBets={user.paymentConfirmed}
      />
    </div>
  );
}