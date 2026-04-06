"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGuess } from "@/app/actions/guesses";
import { toast } from "sonner";

interface BetDialogProps {
  game: {
    id: string;
    teamA: string;
    teamB: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingGuess?: { guessA: number; guessB: number };
}

export default function BetDialog({
  game,
  open,
  onOpenChange,
  existingGuess,
}: BetDialogProps) {
  const [scoreA, setScoreA] = useState(() => existingGuess?.guessA?.toString() ?? "0");
  const [scoreB, setScoreB] = useState(() => existingGuess?.guessB?.toString() ?? "0");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const a = parseInt(scoreA);
    const b = parseInt(scoreB);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      toast.error("Insira placares válidos (números ≥ 0)");
      return;
    }
    if (!game) return;

    console.log("[BetDialog] Enviando palpite", {
      matchId: game.id,
      teamA: game.teamA,
      teamB: game.teamB,
      guessA: a,
      guessB: b,
    });

    startTransition(async () => {
      const result = await saveGuess(game.id, a, b);
      if (result?.error) {
        console.error("[BetDialog] Erro ao salvar palpite", {
          matchId: game.id,
          teamA: game.teamA,
          teamB: game.teamB,
          guessA: a,
          guessB: b,
          error: result.error,
        });
        toast.error(result.error);
      } else {
        console.log("[BetDialog] Palpite salvo com sucesso", {
          matchId: game.id,
          teamA: game.teamA,
          teamB: game.teamB,
          guessA: a,
          guessB: b,
        });
        toast.success("Palpite salvo com sucesso!");
        onOpenChange(false);
      }
    });
  };

  // Reset scores when dialog opens with new game
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && game) {
      setScoreA(existingGuess?.guessA?.toString() ?? "0");
      setScoreB(existingGuess?.guessB?.toString() ?? "0");
    }
    onOpenChange(isOpen);
  };

  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-center text-lg">
            {game.teamA} vs {game.teamB}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 py-6">
          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm font-medium">{game.teamA}</Label>
            <Input
              type="number"
              min={0}
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              className="w-20 text-center text-2xl font-display font-bold"
              placeholder="0"
            />
          </div>

          <span className="text-2xl font-bold text-muted-foreground mt-6">
            ×
          </span>

          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm font-medium">{game.teamB}</Label>
            <Input
              type="number"
              min={0}
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              className="w-20 text-center text-2xl font-display font-bold"
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar Palpite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
