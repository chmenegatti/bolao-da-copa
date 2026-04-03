"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import GameCard from "@/components/GameCard";
import BetDialog from "@/components/BetDialog";
import { formatMatchDate, formatMatchDateKey } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
  matchId: string;
  guessA: number;
  guessB: number;
  pointsEarned: number | null;
}

interface GamesListProps {
  matches: Match[];
  guesses: Guess[];
}

export default function GamesList({ matches, guesses }: GamesListProps) {
  const [selectedGame, setSelectedGame] = useState<Match | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(() => new Date());

  const handleBet = (game: Match) => {
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

  const filteredMatches = dateFilter
    ? matches.filter((match) => formatMatchDateKey(new Date(match.datetime)) === format(dateFilter, "yyyy-MM-dd"))
    : matches;

  // Group matches by date
  const grouped = filteredMatches.reduce<Record<string, Match[]>>((acc, match) => {
    const dateKey = formatMatchDate(new Date(match.datetime), "dd 'de' MMMM");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

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
                <GameCard
                  key={match.id}
                  game={match}
                  guess={guesses.find((g) => g.matchId === match.id)}
                  onBet={handleBet}
                />
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
