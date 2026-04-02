import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import GamesList from "@/components/GamesList";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const user = await getRequiredUser();

  const [matches, guesses] = await Promise.all([
    prisma.match.findMany({
      orderBy: { datetime: "asc" },
    }),
    prisma.guess.findMany({
      where: { userId: user.id },
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

  const serializedGuesses = guesses.map((g) => ({
    id: g.id,
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
      <GamesList matches={serializedMatches} guesses={serializedGuesses} />
    </div>
  );
}