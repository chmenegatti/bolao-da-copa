"use client";

import { useState } from "react";
import GameCard from "@/components/GameCard";
import BetDialog from "@/components/BetDialog";
import { formatMatchDate } from "@/lib/timezone";

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

  const handleBet = (game: Match) => {
    setSelectedGame(game);
    setDialogOpen(true);
  };

  const existingGuess = selectedGame
    ? guesses.find((g) => g.matchId === selectedGame.id)
    : undefined;

  // Group matches by date
  const grouped = matches.reduce<Record<string, Match[]>>((acc, match) => {
    const dateKey = formatMatchDate(new Date(match.datetime), "dd 'de' MMMM");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

  return (
    <>
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
