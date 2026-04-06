"use client";

import { Calendar, Clock, Lock, CheckCircle2, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isBettingOpen, formatMatchDate, formatMatchTime } from "@/lib/timezone";

interface GameCardProps {
  game: {
    id: string;
    teamA: string;
    teamB: string;
    datetime: string;
    groupStage: string;
    scoreA: number | null;
    scoreB: number | null;
    status: string;
  };
  guess?: {
    id: string;
    guessA: number;
    guessB: number;
    pointsEarned: number | null;
  };
  onBet?: (game: GameCardProps["game"]) => void;
  canPlaceBets: boolean;
}

export default function GameCard({ game, guess, onBet, canPlaceBets }: GameCardProps) {
  const open = isBettingOpen(new Date(game.datetime));
  const hasFinalScore = game.scoreA !== null && game.scoreB !== null;
  const isFinished = game.status === "FINISHED" || hasFinalScore;
  const canBet = open && !isFinished && canPlaceBets;

  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
        <Badge variant="outline" className="text-xs font-medium">
          {game.groupStage}
        </Badge>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatMatchDate(new Date(game.datetime))}
          <Clock className="h-3 w-3 ml-1" />
          {formatMatchTime(new Date(game.datetime))}
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="font-display font-semibold text-lg">{game.teamA}</p>
          </div>

          <div className="mx-4 flex flex-col items-center">
            {isFinished ? (
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-bold text-primary">
                  {game.scoreA}
                </span>
                <span className="text-muted-foreground font-medium">×</span>
                <span className="font-display text-2xl font-bold text-primary">
                  {game.scoreB}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                VS
              </span>
            )}
          </div>

          <div className="flex-1 text-center">
            <p className="font-display font-semibold text-lg">{game.teamB}</p>
          </div>
        </div>
      </div>

      {/* Bet area */}
      {guess && (
        <div
          className={`mx-4 mb-3 rounded-lg px-3 py-2 text-sm ${isFinished
            ? (guess.pointsEarned ?? 0) >= 25
              ? "bg-success/10 border border-success/30"
              : (guess.pointsEarned ?? 0) > 0
                ? "bg-warning/10 border border-warning/30"
                : "bg-muted/50 border border-border"
            : "bg-primary/5 border border-primary/20"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Seu palpite:</span>
            <span className="font-semibold">
              {guess.guessA} × {guess.guessB}
            </span>
            {isFinished && guess.pointsEarned !== null && (
              <Badge
                className={
                  guess.pointsEarned >= 25
                    ? "bg-success text-success-foreground"
                    : guess.pointsEarned > 0
                      ? "bg-warning text-warning-foreground"
                      : "bg-muted text-muted-foreground"
                }
              >
                +{guess.pointsEarned} pts
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Action */}
      {onBet && (
        <div className="px-4 pb-4">
          {canBet ? (
            <Button
              onClick={() => onBet(game)}
              className="w-full"
              variant={guess ? "outline" : "default"}
            >
              {guess ? (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Palpite
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Fazer Palpite
                </>
              )}
            </Button>
          ) : isFinished ? (
            <Button className="w-full" variant="outline" disabled>
              <Lock className="h-4 w-4 mr-2" />
              Partida encerrada
            </Button>
          ) : !canPlaceBets ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-500/10 py-2 text-sm text-amber-700 dark:text-amber-300">
              <Lock className="h-4 w-4" />
              Pagamento pendente
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 py-2 text-sm text-destructive">
              <Lock className="h-4 w-4" />
              Apostas encerradas
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
