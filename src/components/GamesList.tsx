"use client";

import { useState } from "react";
import { ChevronDown, Users, X } from "lucide-react";
import GameCard from "@/components/GameCard";
import BetDialog from "@/components/BetDialog";
import { formatMatchDate, formatMatchDateKey, isBettingOpen } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { PAYMENT_PENDING_MESSAGE } from "@/lib/payment";

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  datetime: string;
  groupStage: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
}

interface Guess {
  id: string;
  userId: string;
  matchId: string;
  guessA: number;
  guessB: number;
  pointsEarned: number | null;
}

interface OpponentGuess extends Guess {
  userName: string;
}

interface GamesListProps {
  matches: Match[];
  guesses: Guess[];
  opponentGuesses: OpponentGuess[];
  canPlaceBets: boolean;
}

export default function GamesList({ matches, guesses, opponentGuesses, canPlaceBets }: GamesListProps) {
  const [selectedGame, setSelectedGame] = useState<Match | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(() => new Date());

  const handleBet = (game: Match) => {
    if (!canPlaceBets) {
      toast.error(PAYMENT_PENDING_MESSAGE);
      return;
    }

    const isFinished = game.status === "FINISHED" || (game.scoreA !== null && game.scoreB !== null);
    if (isFinished) {
      return;
    }
    setSelectedGame(game);
    setDialogOpen(true);
  };

  const existingGuess = selectedGame
    ? guesses.find((g) => g.matchId === selectedGame.id)
    : undefined;

  const selectedDateKey = dateFilter ? formatMatchDateKey(dateFilter) : undefined;
  const filteredMatches = selectedDateKey
    ? matches.filter((match) => formatMatchDateKey(new Date(match.datetime)) === selectedDateKey)
    : matches;

  // Group matches by date
  const grouped = filteredMatches.reduce<Record<string, Match[]>>((acc, match) => {
    const dateKey = formatMatchDate(new Date(match.datetime), "dd 'de' MMMM");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

  const opponentGuessesByMatch = opponentGuesses.reduce<Record<string, OpponentGuess[]>>((acc, guess) => {
    if (!acc[guess.matchId]) acc[guess.matchId] = [];
    acc[guess.matchId].push(guess);
    return acc;
  }, {});

  return (
    <>
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Filtrar por data</p>
            <p className="text-xs text-muted-foreground">
              Use o calendário para ver apenas os jogos de um dia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DatePicker value={dateFilter} onChange={setDateFilter} />

            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-8">
        {Object.entries(grouped).map(([date, dateMatches]) => (
          <div key={date}>
            <h2 className="font-display text-lg font-semibold mb-4 text-muted-foreground">
              {date}
            </h2>
            <div className="grid gap-4">
              {dateMatches.map((match) => (
                <div key={match.id} className="space-y-3">
                  <GameCard
                    game={match}
                    guess={guesses.find((g) => g.matchId === match.id)}
                    onBet={handleBet}
                    canPlaceBets={canPlaceBets}
                  />

                  {(() => {
                    const bettingClosed =
                      match.status === "FINISHED" || !isBettingOpen(new Date(match.datetime));

                    if (!bettingClosed) return null;

                    const guessesForMatch = opponentGuessesByMatch[match.id] ?? [];
                    if (guessesForMatch.length === 0) return null;

                    return (
                      <details className="group overflow-hidden rounded-2xl border bg-card shadow-sm">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Users className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Palpites dos adversários</p>
                              <p className="text-xs text-muted-foreground">
                                {guessesForMatch.length} palpite{guessesForMatch.length === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                        </summary>

                        <div className="border-t px-4 py-4">
                          <div className="grid gap-3">
                            {guessesForMatch.map((guess) => (
                              <div
                                key={guess.id}
                                className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="text-sm font-semibold">{guess.userName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {guess.guessA} × {guess.guessB}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Palpite fechado
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <Card className="mt-4 p-6 text-center text-muted-foreground">
          Nenhuma partida encontrada para a data selecionada.
        </Card>
      )}

      <BetDialog
        key={selectedGame?.id ?? "bet-dialog"}
        game={selectedGame}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingGuess={
          existingGuess
            ? { guessA: existingGuess.guessA, guessB: existingGuess.guessB }
            : undefined
        }
      />
    </>
  );
}
