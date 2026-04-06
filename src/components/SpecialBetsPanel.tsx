"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Crown, Crosshair, Lock } from "lucide-react";
import {
  saveTopScorerBet,
  saveChampionBet,
} from "@/app/actions/special-bets";
import { toast } from "sonner";

interface SpecialBetsPanelProps {
  topScorerBet: {
    playerName: string;
    totalGoals: number;
    pointsEarned: number | null;
  } | null;
  championBet: {
    champion: string;
    runnerUp: string;
    finalScoreA: number;
    finalScoreB: number;
    pointsEarned: number | null;
  } | null;
  bettingOpen: boolean;
  topScorerClosed: boolean;
  championClosed: boolean;
  topScorerResult: { playerName: string; totalGoals: number } | null;
  championResultData: {
    champion: string;
    runnerUp: string;
    finalScoreA: number;
    finalScoreB: number;
  } | null;
  canPlaceBets: boolean;
}

export default function SpecialBetsPanel({
  topScorerBet,
  championBet,
  bettingOpen,
  topScorerClosed,
  championClosed,
  topScorerResult,
  championResultData,
  canPlaceBets,
}: SpecialBetsPanelProps) {
  const [isPending, startTransition] = useTransition();

  // A aposta fica travada se: já foi feita, prazo fechou, ou resultado já foi lançado
  const topScorerLocked = !!topScorerBet || !bettingOpen || topScorerClosed || !canPlaceBets;
  const championLocked = !!championBet || !bettingOpen || championClosed || !canPlaceBets;

  // Top Scorer form
  const [playerName, setPlayerName] = useState("");
  const [totalGoals, setTotalGoals] = useState("");

  // Champion form
  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");
  const [finalScoreA, setFinalScoreA] = useState("");
  const [finalScoreB, setFinalScoreB] = useState("");

  const handleSaveTopScorer = () => {
    const goals = parseInt(totalGoals);
    if (!playerName.trim() || isNaN(goals)) {
      toast.error("Preencha o nome do jogador e a quantidade de gols.");
      return;
    }
    startTransition(async () => {
      const result = await saveTopScorerBet(playerName.trim(), goals);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Aposta de artilheiro salva!");
      }
    });
  };

  const handleSaveChampion = () => {
    const scoreA = parseInt(finalScoreA);
    const scoreB = parseInt(finalScoreB);
    if (
      !champion.trim() ||
      !runnerUp.trim() ||
      isNaN(scoreA) ||
      isNaN(scoreB)
    ) {
      toast.error("Preencha todos os campos.");
      return;
    }
    startTransition(async () => {
      const result = await saveChampionBet(
        champion.trim(),
        runnerUp.trim(),
        scoreA,
        scoreB
      );
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Aposta de campeão salva!");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Points Legend */}
      <Card className="bg-muted/50 p-4 sm:p-5">
        <h3 className="font-display font-semibold mb-4">Pontuação Especial</h3>
        <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-2 md:gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <Crosshair className="h-4 w-4 text-amber-500" />
              Artilheiro
            </p>
            <ul className="ml-6 space-y-2 text-muted-foreground">
              <li>
                <Badge variant="secondary" className="mr-1">
                  35 pts
                </Badge>
                Acertar jogador + gols
              </li>
              <li>
                <Badge variant="secondary" className="mr-1">
                  20 pts
                </Badge>
                Acertar só o jogador
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <Crown className="h-4 w-4 text-amber-500" />
              Campeão
            </p>
            <ul className="ml-6 space-y-2 text-muted-foreground">
              <li>
                <Badge variant="secondary" className="mr-1">
                  90 pts
                </Badge>
                Campeão + placar + vice
              </li>
              <li>
                <Badge variant="secondary" className="mr-1">
                  70 pts
                </Badge>
                Campeão + placar
              </li>
              <li>
                <Badge variant="secondary" className="mr-1">
                  50 pts
                </Badge>
                Só o campeão
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Top Scorer Bet */}
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Crosshair className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Artilheiro</h2>
            <p className="text-sm text-muted-foreground">
              Quem será o artilheiro da Copa?
            </p>
          </div>
          {(topScorerLocked || !bettingOpen) && !topScorerResult && (
            <Badge className="ml-auto bg-red-600 text-white">
              <Lock className="h-3 w-3 mr-1" />
              {!canPlaceBets
                ? "Pagamento pendente"
                : !bettingOpen
                  ? "Prazo Encerrado"
                  : topScorerBet
                    ? "Aposta Registrada"
                    : "Encerrado"}
            </Badge>
          )}
        </div>

        {topScorerResult && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              Resultado: {topScorerResult.playerName} — {topScorerResult.totalGoals} gols
            </p>
          </div>
        )}

        {topScorerBet && (
          <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Sua aposta: {topScorerBet.playerName} — {topScorerBet.totalGoals} gols
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Esta aposta é única e não pode ser alterada.</p>
          </div>
        )}

        {topScorerBet?.pointsEarned !== null && topScorerBet?.pointsEarned !== undefined && (
          <Badge
            className={`mb-4 ${topScorerBet.pointsEarned >= 35
              ? "bg-green-600 text-white"
              : topScorerBet.pointsEarned > 0
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground"
              }`}
          >
            +{topScorerBet.pointsEarned} pts
          </Badge>
        )}

        {!topScorerLocked && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block">Nome do Jogador</Label>
                <Input
                  placeholder="Ex: Mbappé"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1 block">Quantidade de Gols</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ex: 7"
                  value={totalGoals}
                  onChange={(e) => setTotalGoals(e.target.value)}
                />
              </div>
            </div>
            <Button className="mt-5 w-full sm:w-auto" onClick={handleSaveTopScorer} disabled={isPending}>
              Salvar Aposta
            </Button>
          </>
        )}
      </Card>

      {/* Champion Bet */}
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Campeão</h2>
            <p className="text-sm text-muted-foreground">
              Quem será campeão, vice e o placar da final?
            </p>
          </div>
          {(championLocked || !bettingOpen) && !championResultData && (
            <Badge className="ml-auto bg-red-600 text-white">
              <Lock className="h-3 w-3 mr-1" />
              {!canPlaceBets
                ? "Pagamento pendente"
                : !bettingOpen
                  ? "Prazo Encerrado"
                  : championBet
                    ? "Aposta Registrada"
                    : "Encerrado"}
            </Badge>
          )}
        </div>

        {championResultData && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              Resultado: {championResultData.champion} {championResultData.finalScoreA} ×{" "}
              {championResultData.finalScoreB} {championResultData.runnerUp}
            </p>
          </div>
        )}

        {championBet && (
          <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
              Sua aposta: {championBet.champion} {championBet.finalScoreA} × {championBet.finalScoreB} ({championBet.runnerUp})
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Esta aposta é única e não pode ser alterada.</p>
          </div>
        )}

        {championBet?.pointsEarned !== null && championBet?.pointsEarned !== undefined && (
          <Badge
            className={`mb-4 ${championBet.pointsEarned >= 90
              ? "bg-green-600 text-white"
              : championBet.pointsEarned >= 50
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground"
              }`}
          >
            +{championBet.pointsEarned} pts
          </Badge>
        )}

        {!championLocked && (
          <>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block">Campeão</Label>
                  <Input
                    placeholder="Ex: Brasil"
                    value={champion}
                    onChange={(e) => setChampion(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block">Vice-Campeão</Label>
                  <Input
                    placeholder="Ex: Argentina"
                    value={runnerUp}
                    onChange={(e) => setRunnerUp(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block">Placar da Final</Label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1">
                    <Label className="mb-1 block text-xs text-muted-foreground">
                      {champion || "Campeão"}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="text-center"
                      value={finalScoreA}
                      onChange={(e) => setFinalScoreA(e.target.value)}
                    />
                  </div>
                  <span className="mt-5 font-bold text-muted-foreground">×</span>
                  <div className="flex-1">
                    <Label className="mb-1 block text-xs text-muted-foreground">
                      {runnerUp || "Vice"}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="text-center"
                      value={finalScoreB}
                      onChange={(e) => setFinalScoreB(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button className="mt-5 w-full sm:w-auto" onClick={handleSaveChampion} disabled={isPending}>
              Salvar Aposta
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
