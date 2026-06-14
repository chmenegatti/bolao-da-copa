"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { superEditGuess } from "@/app/actions/edit-guesses";
import { toast } from "sonner";

interface EditGuessItem {
  matchId: string;
  teamA: string;
  teamB: string;
  groupStage: string;
  dateLabel: string;
  timeLabel: string;
  finished: boolean;
  resultA: number | null;
  resultB: number | null;
  guessA: number | null;
  guessB: number | null;
  pointsEarned: number | null;
}

function GuessRow({ item }: { item: EditGuessItem }) {
  const [scoreA, setScoreA] = useState(item.guessA?.toString() ?? "");
  const [scoreB, setScoreB] = useState(item.guessB?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const a = parseInt(scoreA, 10);
    const b = parseInt(scoreB, 10);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      toast.error("Insira placares válidos (números ≥ 0)");
      return;
    }
    startTransition(async () => {
      const result = await superEditGuess(item.matchId, a, b);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Palpite salvo!");
      }
    });
  };

  return (
    <Card className="p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium">
            {item.groupStage}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {item.dateLabel} • {item.timeLabel}
          </span>
        </div>
        {item.finished && (
          <Badge className="bg-muted text-muted-foreground">
            Resultado: {item.resultA} × {item.resultB}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="font-display font-semibold flex-1 min-w-0 truncate">
          {item.teamA} vs {item.teamB}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="number"
            min={0}
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            className="w-16 text-center text-lg font-display font-bold"
            placeholder="0"
          />
          <span className="text-muted-foreground font-bold">×</span>
          <Input
            type="number"
            min={0}
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            className="w-16 text-center text-lg font-display font-bold"
            placeholder="0"
          />
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? "..." : "Salvar"}
          </Button>
        </div>
      </div>

      {item.pointsEarned !== null && (
        <p className="text-xs text-muted-foreground mt-2 text-right">
          Pontos: <span className="font-semibold">{item.pointsEarned}</span>
        </p>
      )}
    </Card>
  );
}

export default function EditGuessesList({ items }: { items: EditGuessItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma partida cadastrada.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <GuessRow key={item.matchId} item={item} />
      ))}
    </div>
  );
}
