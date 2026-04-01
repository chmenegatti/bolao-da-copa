import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  await requireAdmin();

  const [matches, users, tournamentResultRows] = await Promise.all([
    prisma.match.findMany({
      orderBy: { datetime: "asc" },
      include: {
        _count: { select: { guesses: true } },
        goals: { orderBy: { minute: "asc" } },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, totalPoints: true, createdAt: true },
    }),
    prisma.tournamentResult.findMany(),
  ]);

  const topScorerRow = tournamentResultRows.find((r) => r.key === "topScorer");
  const championRow = tournamentResultRows.find((r) => r.key === "champion");

  const tournamentResults = {
    topScorer:
      topScorerRow?.topScorerName != null && topScorerRow.topScorerGoals != null
        ? { playerName: topScorerRow.topScorerName, totalGoals: topScorerRow.topScorerGoals }
        : null,
    champion: championRow
      ? {
        champion: championRow.champion!,
        runnerUp: championRow.runnerUp!,
        finalScoreA: championRow.finalScoreA!,
        finalScoreB: championRow.finalScoreB!,
      }
      : null,
  };

  const serializedMatches = matches.map((m) => ({
    id: m.id,
    teamA: m.teamA,
    teamB: m.teamB,
    datetime: m.datetime.toISOString(),
    groupStage: m.groupStage,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    status: m.status,
    guessCount: m._count.guesses,
    goals: m.goals.map((g) => ({
      id: g.id,
      team: g.team,
      player: g.player,
      minute: g.minute,
    })),
  }));

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie partidas, resultados e usuários
        </p>
      </div>
      <AdminPanel matches={serializedMatches} users={serializedUsers} tournamentResults={tournamentResults} />
    </div>
  );
}
