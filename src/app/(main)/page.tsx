import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import { canUserPlaceGuess } from "@/lib/game-logic";
import { getBettingDeadlineClasses, getBettingDeadlineInfo, getNextBettingClose } from "@/lib/bet-dashboard";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Calendar, CheckCircle2, Clock, Target, Trophy } from "lucide-react";
import { formatMatchDate, formatMatchTime } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getRequiredUser();

  const [matches, guesses, profile, topScorerBet, championBet] = await Promise.all([
    prisma.match.findMany({ orderBy: { datetime: "asc" } }),
    prisma.guess.findMany({ where: { userId: user.id }, include: { match: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { totalPoints: true } }),
    prisma.topScorerBet.findUnique({ where: { userId: user.id } }),
    prisma.championBet.findUnique({ where: { userId: user.id } }),
  ]);

  const closedGuesses = guesses
    .filter((guess) => guess.match.status === "FINISHED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const openMatches = matches
    .filter((match) => match.status !== "FINISHED" && canUserPlaceGuess(match.datetime))
    .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
    .slice(0, 3);

  const nextClosingMatch = getNextBettingClose(matches);
  const totalPoints = profile?.totalPoints ?? 0;
  const matchPoints = guesses.reduce((acc, guess) => acc + (guess.pointsEarned ?? 0), 0);
  const specialPoints = (topScorerBet?.pointsEarned ?? 0) + (championBet?.pointsEarned ?? 0);
  const exactHits = guesses.filter((guess) => guess.pointsEarned === 25).length;
  const positiveHits = guesses.filter((guess) => (guess.pointsEarned ?? 0) > 0).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold">Dashboard geral</h1>
          <p className="text-muted-foreground">
            Resumo da sua participação, próximos fechamentos e últimos palpites encerrados.
          </p>
        </div>

        {nextClosingMatch ? (
          <Card className={cn("border", getBettingDeadlineClasses(nextClosingMatch.tone))}>
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="font-semibold">Próximo fechamento de palpites</p>
                <p className="text-sm opacity-90">
                  {nextClosingMatch.match.teamA} vs {nextClosingMatch.match.teamB}
                </p>
                <p className="text-xs opacity-80">
                  {formatMatchDate(nextClosingMatch.match.datetime)} às {formatMatchTime(nextClosingMatch.match.datetime)} · fecha em {nextClosingMatch.countdown}
                </p>
              </div>
              <Badge className={cn("border text-sm", getBettingDeadlineClasses(nextClosingMatch.tone))}>
                <Clock className="h-3.5 w-3.5 mr-1" />
                Fecha em {nextClosingMatch.countdown}
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Não há partidas abertas para palpites no momento.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold font-display">{totalPoints}</p><p className="text-xs text-muted-foreground">Pontos totais</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><Target className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold font-display">{matchPoints}</p><p className="text-xs text-muted-foreground">Pontos em partidas</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><Trophy className="h-5 w-5 text-amber-500" /></div><div><p className="text-2xl font-bold font-display">{specialPoints}</p><p className="text-xs text-muted-foreground">Apostas especiais</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><CheckCircle2 className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold font-display">{positiveHits}</p><p className="text-xs text-muted-foreground">Palpites com pontos</p></div></div></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardContent className="p-5 space-y-4"><div><h2 className="font-display text-xl font-semibold">Últimos 3 palpites fechados</h2><p className="text-sm text-muted-foreground">Os 3 últimos jogos que você palpitou e que já têm placar definido.</p></div>{closedGuesses.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum palpite fechado ainda.</p> : <div className="space-y-3">{closedGuesses.map((guess) => { const points = guess.pointsEarned ?? 0; const isExact = points === 25; const isPartial = points > 0 && points < 25; return (<div key={guess.id} className="rounded-xl border bg-card p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{guess.match.teamA} vs {guess.match.teamB}</p><p className="text-xs text-muted-foreground">{formatMatchDate(guess.match.datetime, "dd MMM")} · {formatMatchTime(guess.match.datetime)} · {guess.match.groupStage}</p></div><Badge className={cn(isExact ? "bg-green-600 text-white" : isPartial ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground")}>+{points} pts</Badge></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground mb-1">Resultado final</p><p className="font-display text-xl font-bold">{guess.match.scoreA} <span className="text-muted-foreground">×</span> {guess.match.scoreB}</p></div><div className="rounded-lg bg-primary/5 p-3"><p className="text-xs text-muted-foreground mb-1">Seu palpite</p><p className="font-display text-xl font-bold">{guess.guessA} <span className="text-muted-foreground">×</span> {guess.guessB}</p></div></div></div>); })}</div>}</CardContent></Card>

        <Card><CardContent className="p-5 space-y-4"><div><h2 className="font-display text-xl font-semibold">Próximos 3 palpites em aberto</h2><p className="text-sm text-muted-foreground">As próximas partidas ainda abertas para apostar.</p></div>{openMatches.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma partida aberta agora.</p> : <div className="space-y-3">{openMatches.map((match) => { const deadline = getBettingDeadlineInfo(match.datetime); const userGuess = guesses.find((guess) => guess.matchId === match.id); return (<div key={match.id} className="rounded-xl border bg-card p-4 space-y-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{match.teamA} vs {match.teamB}</p><p className="text-xs text-muted-foreground">{formatMatchDate(match.datetime, "dd MMM")} · {formatMatchTime(match.datetime)} · {match.groupStage}</p></div><Badge className={cn("border", getBettingDeadlineClasses(deadline.tone))}><Calendar className="h-3.5 w-3.5 mr-1" />Fecha em {deadline.countdown}</Badge></div><div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Seu palpite</span><span className="font-semibold">{userGuess ? `${userGuess.guessA} × ${userGuess.guessB}` : "Ainda sem palpite"}</span></div></div>); })}</div>}</CardContent></Card>
      </div>

      <Card className="p-6 gradient-hero text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-white/70">Resumo geral</p>
            <p className="font-display text-4xl font-bold mt-1">{totalPoints}</p>
            <p className="text-sm text-white/70 mt-1">{exactHits} acertos exatos · {positiveHits} palpites com pontos</p>
          </div>
          <Link href="/jogos" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/25">
            Ir para jogos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}