import { prisma } from "@/lib/prisma";
import { Trophy, Crown, Target } from "lucide-react";
import { formatMatchDate } from "@/lib/timezone";

export const dynamic = "force-dynamic";

// Abreviação do time: 3 primeiras letras em maiúsculas
function abbr(team: string) {
  return team.trim().slice(0, 3).toUpperCase();
}

// Classe de cor da célula conforme os pontos
function cellClass(points: number | null | undefined) {
  if (points === null || points === undefined) return "text-muted-foreground/40";
  if (points === 25) return "bg-green-600 text-white font-semibold";
  if (points > 0) return "bg-amber-500/90 text-white font-medium";
  return "text-muted-foreground";
}

function specialClass(points: number | null | undefined) {
  if (points === null || points === undefined) return "text-muted-foreground/40";
  if (points > 0) return "bg-green-600 text-white font-semibold";
  return "text-muted-foreground";
}

export default async function ResumoPage() {
  const [users, matches, topScorerResult, championResult] = await Promise.all([
    prisma.user.findMany({
      where: { name: { not: "Administrador" } },
      select: {
        id: true,
        name: true,
        totalPoints: true,
        createdAt: true,
        guesses: { select: { matchId: true, pointsEarned: true } },
        topScorerBet: {
          select: { pointsEarned: true, playerName: true, totalGoals: true },
        },
        championBet: {
          select: {
            pointsEarned: true,
            champion: true,
            runnerUp: true,
            finalScoreA: true,
            finalScoreB: true,
          },
        },
      },
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { status: "FINISHED" },
          { AND: [{ scoreA: { not: null } }, { scoreB: { not: null } }] },
        ],
      },
      orderBy: { datetime: "asc" },
      select: {
        id: true,
        teamA: true,
        teamB: true,
        scoreA: true,
        scoreB: true,
        datetime: true,
      },
    }),
    prisma.tournamentResult.findUnique({ where: { key: "topScorer" } }),
    prisma.tournamentResult.findUnique({ where: { key: "champion" } }),
  ]);

  const rankedUsers = users
    .map((user) => {
      const pointsByMatch = new Map<string, number | null>();
      for (const g of user.guesses) pointsByMatch.set(g.matchId, g.pointsEarned);

      const exactScoreHits = user.guesses.filter((g) => g.pointsEarned === 25).length;
      const highAccuracyHits = user.guesses.filter((g) => g.pointsEarned === 20).length;
      const specialPoints =
        (user.topScorerBet?.pointsEarned ?? 0) + (user.championBet?.pointsEarned ?? 0);

      return { ...user, pointsByMatch, exactScoreHits, highAccuracyHits, specialPoints };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactScoreHits !== a.exactScoreHits) return b.exactScoreHits - a.exactScoreHits;
      if (b.highAccuracyHits !== a.highAccuracyHits) return b.highAccuracyHits - a.highAccuracyHits;
      if (b.specialPoints !== a.specialPoints) return b.specialPoints - a.specialPoints;
      if (a.createdAt.getTime() !== b.createdAt.getTime()) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });

  return (
    <div className="mx-auto max-w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-gold" />
          Resumo Final
        </h1>
        <p className="text-muted-foreground mt-1">
          Pontuação de cada apostador em todos os jogos, na final e no artilheiro.
          Ordenado por pontuação total (mesmos critérios de desempate do ranking).
        </p>
      </div>

      {/* Legenda */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-600" /> Placar exato / acerto especial
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-500/90" /> Acerto parcial
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border bg-muted" /> 0 pontos
        </span>
        <span>— sem aposta</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-20 bg-muted/50 px-2 py-2 text-center font-semibold">
                #
              </th>
              <th className="sticky left-10 z-20 bg-muted/50 px-3 py-2 text-left font-semibold min-w-40">
                Apostador
              </th>
              <th className="px-2 py-2 text-center font-semibold">Total</th>

              {matches.map((m) => (
                <th
                  key={m.id}
                  className="px-1 py-2 text-center font-medium"
                  title={`${m.teamA} ${m.scoreA} × ${m.scoreB} ${m.teamB} — ${formatMatchDate(new Date(m.datetime), "dd/MM")}`}
                >
                  <div className="flex flex-col items-center gap-0.5 leading-tight">
                    <span>{abbr(m.teamA)}</span>
                    <span className="text-[10px] font-bold text-foreground">
                      {m.scoreA}×{m.scoreB}
                    </span>
                    <span>{abbr(m.teamB)}</span>
                  </div>
                </th>
              ))}

              <th
                className="px-2 py-2 text-center font-semibold"
                title={
                  championResult?.champion
                    ? `Final: ${championResult.champion} ${championResult.finalScoreA} × ${championResult.finalScoreB} ${championResult.runnerUp}`
                    : "Final não definida"
                }
              >
                <div className="flex flex-col items-center gap-0.5">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  Final
                </div>
              </th>
              <th
                className="px-2 py-2 text-center font-semibold"
                title={
                  topScorerResult?.topScorerName
                    ? `Artilheiro: ${topScorerResult.topScorerName} (${topScorerResult.topScorerGoals} gols)`
                    : "Artilheiro não definido"
                }
              >
                <div className="flex flex-col items-center gap-0.5">
                  <Target className="h-3.5 w-3.5 text-amber-500" />
                  Artilh.
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rankedUsers.map((user, index) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="sticky left-0 z-10 bg-card px-2 py-2 text-center font-bold">
                  {index + 1}
                </td>
                <td className="sticky left-10 z-10 bg-card px-3 py-2 text-left font-medium whitespace-nowrap">
                  {user.name}
                </td>
                <td className="px-2 py-2 text-center font-bold">{user.totalPoints}</td>

                {matches.map((m) => {
                  const pts = user.pointsByMatch.get(m.id);
                  return (
                    <td key={m.id} className={`px-1 py-2 text-center ${cellClass(pts)}`}>
                      {pts === null || pts === undefined ? "—" : pts}
                    </td>
                  );
                })}

                <td className={`px-2 py-2 text-center ${specialClass(user.championBet?.pointsEarned)}`}>
                  {user.championBet
                    ? user.championBet.pointsEarned ?? "·"
                    : "—"}
                </td>
                <td className={`px-2 py-2 text-center ${specialClass(user.topScorerBet?.pointsEarned)}`}>
                  {user.topScorerBet
                    ? user.topScorerBet.pointsEarned ?? "·"
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rankedUsers.length === 0 && (
        <p className="mt-6 text-center text-muted-foreground">Nenhum apostador encontrado.</p>
      )}
    </div>
  );
}
