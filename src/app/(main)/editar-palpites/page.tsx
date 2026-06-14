import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import { SUPER_EDITOR_USER_ID } from "@/lib/super-editor";
import { formatMatchDate, formatMatchTime } from "@/lib/timezone";
import EditGuessesList from "@/components/EditGuessesList";

export const dynamic = "force-dynamic";

export default async function EditarPalpitesPage() {
  const user = await getRequiredUser();

  if (user.id !== SUPER_EDITOR_USER_ID) {
    redirect("/");
  }

  const [matches, guesses] = await Promise.all([
    prisma.match.findMany({ orderBy: { datetime: "asc" } }),
    prisma.guess.findMany({ where: { userId: user.id } }),
  ]);

  const guessByMatch = new Map(guesses.map((g) => [g.matchId, g]));

  const items = matches.map((match) => {
    const guess = guessByMatch.get(match.id);
    return {
      matchId: match.id,
      teamA: match.teamA,
      teamB: match.teamB,
      groupStage: match.groupStage,
      dateLabel: formatMatchDate(match.datetime, "dd MMM"),
      timeLabel: formatMatchTime(match.datetime),
      finished: match.status === "FINISHED",
      resultA: match.scoreA,
      resultB: match.scoreB,
      guessA: guess?.guessA ?? null,
      guessB: guess?.guessB ?? null,
      pointsEarned: guess?.pointsEarned ?? null,
    };
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Editar Palpites</h1>
        <p className="text-muted-foreground mt-1">
          Edição livre dos seus palpites, sem restrição de prazo.
        </p>
      </div>
      <EditGuessesList items={items} />
    </div>
  );
}
