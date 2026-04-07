"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  Calendar,
  Clock,
  Pencil,
  Trophy,
  Target,
  Shield,
  BarChart3,
  Crown,
  ChevronDown,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  finishMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  createUser,
  updateUser,
  deleteUser,
  resetTournamentData,
  seedBrasileiraoTestData,
  seedWorldCupData,
} from "@/app/actions/admin";
import {
  setTopScorerResult,
  setChampionResult,
} from "@/app/actions/special-bets";
import { formatMatchDate, formatMatchTime, formatMatchDateKey, formatMatchDateTimeForInput } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GoalData {
  id?: string;
  team: string;
  player: string;
  minute: number;
}

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  datetime: string;
  groupStage: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  guessCount: number;
  goals: GoalData[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  totalPoints: number;
  createdAt: string;
}

interface Guess {
  id: string;
  userId: string;
  matchId: string;
  guessA: number;
  guessB: number;
  pointsEarned: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  match: {
    id: string;
    teamA: string;
    teamB: string;
    datetime: string;
    groupStage: string;
    scoreA: number | null;
    scoreB: number | null;
    status: string;
  };
}

interface TournamentResultData {
  topScorer: { playerName: string; totalGoals: number } | null;
  champion: {
    champion: string;
    runnerUp: string;
    finalScoreA: number;
    finalScoreB: number;
  } | null;
}

const KNOCKOUT_STAGES = [
  "Dezessesseisavos de Final",
  "Oitavas de Final",
  "Quartas de Final",
  "Semifinal",
  "Disputa 3º Lugar",
  "Final",
];

type AdminSection = "results" | "jogos" | "tournament" | "users" | "guesses";

const ADMIN_SECTIONS: Array<{ value: AdminSection; label: string; icon: typeof BarChart3 }> = [
  { value: "results", label: "Resultados", icon: BarChart3 },
  { value: "jogos", label: "Jogos", icon: Trophy },
  { value: "tournament", label: "Torneio", icon: Crown },
  { value: "users", label: "Usuários", icon: Shield },
  { value: "guesses", label: "Palpites", icon: Target },
];

const ADMIN_SECTION_ITEMS = Object.fromEntries(
  ADMIN_SECTIONS.map((section) => [section.value, section.label])
) as Record<AdminSection, string>;

export default function AdminPanel({
  matches,
  users,
  guesses,
  tournamentResults,
}: {
  matches: Match[];
  users: User[];
  guesses: Guess[];
  tournamentResults: TournamentResultData;
}) {
  const [isPending, startTransition] = useTransition();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("results");

  const totalMatches = matches.length;
  const finishedCount = matches.filter((m) => m.status === "FINISHED").length;
  const totalUsers = users.length;
  const totalGuesses = matches.reduce((sum, m) => sum + m.guessCount, 0);

  const renderActiveSection = (section: AdminSection) => {
    switch (section) {
      case "results":
        return <ResultsTab matches={matches} isPending={isPending} startTransition={startTransition} />;
      case "jogos":
        return <MatchesTab matches={matches} isPending={isPending} startTransition={startTransition} />;
      case "tournament":
        return <TournamentTab results={tournamentResults} isPending={isPending} startTransition={startTransition} />;
      case "users":
        return <UsersTab users={users} guesses={guesses} isPending={isPending} startTransition={startTransition} />;
      case "guesses":
        return <GuessesTab guesses={guesses} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{totalMatches}</p>
              <p className="text-xs text-muted-foreground">Partidas</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{finishedCount}</p>
              <p className="text-xs text-muted-foreground">Finalizadas</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">Usuários</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{totalGuesses}</p>
              <p className="text-xs text-muted-foreground">Palpites</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-destructive">Resetar base da competição</p>
            <p className="text-sm text-muted-foreground">
              Remove gols, palpites, apostas especiais, resultados, login attempts e zera os pontos de todos os usuários.
              As partidas da Copa são mantidas.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setResetDialogOpen(true)} disabled={isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar dados
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-primary">Seeds rápidos</p>
            <p className="text-sm text-muted-foreground">
              Recria a base da Copa ou recria a base de teste do Brasileirão.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => {
                if (!confirm("Isso vai recriar a base da Copa. Continuar?")) return;
                startTransition(async () => {
                  const result = await seedWorldCupData();
                  if (result?.error) {
                    toast.error(result.error);
                  } else {
                    toast.success("Seed da Copa concluído.");
                  }
                });
              }}
            >
              Seed Copa
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => {
                if (!confirm("Isso vai recriar a base de teste do Brasileirão. Continuar?")) return;
                startTransition(async () => {
                  const result = await seedBrasileiraoTestData();
                  if (result?.error) {
                    toast.error(result.error);
                  } else {
                    toast.success("Seed de teste concluído.");
                  }
                });
              }}
            >
              Seed Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="md:hidden">
          <Card className="p-4">
            <div className="space-y-2">
              <Label htmlFor="admin-section">Seção</Label>
              <Select
                items={ADMIN_SECTION_ITEMS}
                value={activeSection}
                onValueChange={(value) => setActiveSection(value as AdminSection)}
              >
                <SelectTrigger id="admin-section" className="w-full">
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    {(() => {
                      const Icon = ADMIN_SECTIONS.find((section) => section.value === activeSection)?.icon ?? BarChart3;
                      return <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />;
                    })()}
                    <SelectValue placeholder="Selecione uma seção" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                      <SelectItem key={section.value} value={section.value}>
                        <Icon className="h-4 w-4" />
                        {section.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as AdminSection)} className="hidden md:block">
          <TabsList className="grid w-full grid-cols-5">
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.value} value={section.value} className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" />
                  {section.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div>
          {renderActiveSection(activeSection)}
        </div>
      </div>

      <Dialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          setResetDialogOpen(open);
          if (!open) {
            setResetConfirmation("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">
              Resetar dados da competição
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Essa ação apaga gols, palpites, apostas especiais, resultados e login attempts,
              além de zerar os pontos de todos os usuários. As partidas ficam preservadas e as contas não são removidas.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-confirmation" className="block">
                Digite RESETAR para confirmar
              </Label>
              <Input
                id="reset-confirmation"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="RESETAR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending || resetConfirmation.trim().toUpperCase() !== "RESETAR"}
              onClick={() => {
                startTransition(async () => {
                  await resetTournamentData();
                  toast.success("Base da competição resetada.");
                  setResetConfirmation("");
                  setResetDialogOpen(false);
                });
              }}
            >
              {isPending ? "Resetando..." : "Confirmar reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== RESULTS TAB ====================

function ResultsTab({
  matches,
  isPending,
  startTransition,
}: {
  matches: Match[];
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [scores, setScores] = useState<Record<string, { scoreA: string; scoreB: string }>>({});
  const [goalsMap, setGoalsMap] = useState<Record<string, GoalData[]>>({});
  const [goalDialogMatch, setGoalDialogMatch] = useState<Match | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const scheduledMatches = matches.filter((m) => m.status === "SCHEDULED");
  const finishedMatches = matches.filter((m) => m.status === "FINISHED");
  const filteredScheduledMatches = dateFilter
    ? scheduledMatches.filter(
      (match) =>
        formatMatchDateKey(new Date(match.datetime)) === formatMatchDateKey(dateFilter)
    )
    : scheduledMatches;

  const handleFinish = (match: Match) => {
    const s = scores[match.id];
    const scoreA = parseInt(s?.scoreA ?? "");
    const scoreB = parseInt(s?.scoreB ?? "");
    if (isNaN(scoreA) || isNaN(scoreB)) {
      toast.error("Defina o placar antes de finalizar.");
      return;
    }

    const goals = goalsMap[match.id] || [];

    startTransition(async () => {
      const result = await finishMatch(match.id, scoreA, scoreB, goals);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Jogo finalizado e pontos calculados!");
      }
    });
  };

  const addGoal = (matchId: string, goal: GoalData) => {
    setGoalsMap((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), goal],
    }));
  };

  const removeGoal = (matchId: string, index: number) => {
    setGoalsMap((prev) => ({
      ...prev,
      [matchId]: (prev[matchId] || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Pending matches */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Partidas Pendentes ({filteredScheduledMatches.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Filtre por data para inserir os placares mais rápido.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="Filtrar por data" />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {filteredScheduledMatches.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            Nenhuma partida pendente para a data selecionada.
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredScheduledMatches.map((match) => {
              const matchGoals = goalsMap[match.id] || [];
              return (
                <Card key={match.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display font-semibold">
                        {match.teamA} vs {match.teamB}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatMatchDate(new Date(match.datetime))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatMatchTime(new Date(match.datetime))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {match.guessCount} palpites
                        </span>
                        <Badge variant="outline">{match.groupStage}</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* Score inputs */}
                  <div className="flex items-end gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div>
                        <Label className="text-xs">{match.teamA}</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          className="w-20 text-center"
                          value={scores[match.id]?.scoreA ?? ""}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [match.id]: {
                                ...prev[match.id],
                                scoreA: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <span className="text-muted-foreground font-bold mb-0.5">×</span>
                      <div>
                        <Label className="text-xs">{match.teamB}</Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          className="w-20 text-center"
                          value={scores[match.id]?.scoreB ?? ""}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [match.id]: {
                                ...prev[match.id],
                                scoreB: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Goals list */}
                  {matchGoals.length > 0 && (
                    <div className="mb-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Gols:</p>
                      {matchGoals.map((goal, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span>⚽</span>
                          <span className="font-medium">{goal.player}</span>
                          <span className="text-muted-foreground">
                            ({goal.team === "A" ? match.teamA : match.teamB}) {goal.minute}&apos;
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-destructive"
                            onClick={() => removeGoal(match.id, i)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGoalDialogMatch(match)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Gol
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleFinish(match)}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Finalizar
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Finished matches */}
      {finishedMatches.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">
            Finalizados ({finishedMatches.length})
          </h2>
          <div className="space-y-3">
            {finishedMatches.map((match) => (
              <Card key={match.id} className="p-4 opacity-80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-semibold">
                      {match.teamA} vs {match.teamB}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {match.groupStage}
                    </Badge>
                    {match.goals.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {match.goals.map((g) => (
                          <p key={g.id} className="text-xs text-muted-foreground">
                            ⚽ {g.player} ({g.team === "A" ? match.teamA : match.teamB}) {g.minute}&apos;
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-bold text-primary">
                      {match.scoreA}
                    </span>
                    <span className="text-muted-foreground font-medium">×</span>
                    <span className="font-display text-xl font-bold text-primary">
                      {match.scoreB}
                    </span>
                    <Badge className="ml-2 bg-green-600 text-white">
                      Finalizado
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Dialog */}
      <GoalDialog
        key={goalDialogMatch?.id ?? "goal-dialog"}
        match={goalDialogMatch}
        onClose={() => setGoalDialogMatch(null)}
        onAdd={(goal) => {
          if (goalDialogMatch) {
            addGoal(goalDialogMatch.id, goal);
            setGoalDialogMatch(null);
          }
        }}
      />
    </div>
  );
}

// ==================== GOAL DIALOG ====================

function GoalDialog({
  match,
  onClose,
  onAdd,
}: {
  match: Match | null;
  onClose: () => void;
  onAdd: (goal: GoalData) => void;
}) {
  const [team, setTeam] = useState("A");
  const [player, setPlayer] = useState("");
  const [minute, setMinute] = useState("");

  const handleSubmit = () => {
    if (!player.trim() || !minute) {
      toast.error("Preencha jogador e minuto.");
      return;
    }
    onAdd({ team, player: player.trim(), minute: parseInt(minute) });
    setPlayer("");
    setMinute("");
    setTeam("A");
    onClose();
  };

  return (
    <Dialog open={!!match} onOpenChange={(open) => !open && onClose()}>
      <DialogContent key={match?.id ?? "goal-dialog"} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar Gol</DialogTitle>
        </DialogHeader>
        {match && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="goal-team" className="block">Time</Label>
              <Select
                value={team}
                onValueChange={(value) => setTeam(value === "B" ? "B" : "A")}
              >
                <SelectTrigger id="goal-team">
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">{match.teamA}</SelectItem>
                  <SelectItem value="B">{match.teamB}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-player" className="block">Jogador</Label>
              <Input
                id="goal-player"
                placeholder="Nome do jogador"
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-minute" className="block">Minuto</Label>
              <Input
                id="goal-minute"
                type="number"
                min={1}
                max={120}
                placeholder="45"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MATCHES TAB (CRUD) ====================

function MatchesTab({
  matches,
  isPending,
  startTransition,
}: {
  matches: Match[];
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [stageFilter, setStageFilter] = useState("all");

  const knockoutMatches = matches.filter((m) =>
    KNOCKOUT_STAGES.includes(m.groupStage)
  );
  const groupMatches = matches.filter(
    (m) => !KNOCKOUT_STAGES.includes(m.groupStage)
  );

  const displayMatches = stageFilter === "all"
    ? matches
    : stageFilter === "groups"
      ? groupMatches
      : matches.filter((m) => m.groupStage === stageFilter);

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createMatch(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Partida criada!");
        setCreateDialogOpen(false);
      }
    });
  };

  const handleUpdate = (matchId: string, formData: FormData) => {
    startTransition(async () => {
      const result = await updateMatch(matchId, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Partida atualizada!");
        setEditMatch(null);
      }
    });
  };

  const handleDelete = (matchId: string) => {
    if (!confirm("Excluir esta partida?")) return;
    startTransition(async () => {
      const result = await deleteMatch(matchId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Partida excluída.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={stageFilter} onValueChange={(value) => setStageFilter(value ?? "all")}>
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Filtrar por fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ({matches.length})</SelectItem>
              <SelectItem value="groups">Fase de Grupos ({groupMatches.length})</SelectItem>
              {KNOCKOUT_STAGES.map((stage) => {
                const count = matches.filter((m) => m.groupStage === stage).length;
                return (
                  <SelectItem key={stage} value={stage}>
                    {stage} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Partida
        </Button>
      </div>

      {/* Summary of knockout stages */}
      {knockoutMatches.length > 0 && stageFilter === "all" && (
        <Card className="p-4">
          <h3 className="font-display font-semibold mb-2">Fases Eliminatórias</h3>
          <div className="flex flex-wrap gap-2">
            {KNOCKOUT_STAGES.map((stage) => {
              const count = knockoutMatches.filter((m) => m.groupStage === stage).length;
              if (count === 0) return null;
              return (
                <Badge
                  key={stage}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setStageFilter(stage)}
                >
                  {stage}: {count}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      {/* Matches table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partida</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Palpites</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayMatches.map((match) => (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {match.teamA} vs {match.teamB}
                  {match.status === "FINISHED" && (
                    <span className="ml-2 text-primary font-bold">
                      {match.scoreA} × {match.scoreB}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatMatchDate(new Date(match.datetime))}{" "}
                  {formatMatchTime(new Date(match.datetime))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{match.groupStage}</Badge>
                </TableCell>
                <TableCell>
                  {match.status === "FINISHED" ? (
                    <Badge className="bg-green-600 text-white">Finalizado</Badge>
                  ) : (
                    <Badge variant="secondary">Agendado</Badge>
                  )}
                </TableCell>
                <TableCell>{match.guessCount}</TableCell>
                <TableCell className="text-right">
                  {match.status !== "FINISHED" && (
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditMatch(match)}
                        disabled={isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(match.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {displayMatches.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma partida encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create match dialog */}
      <MatchFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Nova Partida"
        onSubmit={handleCreate}
        isPending={isPending}
        submitLabel="Criar Partida"
      />

      {/* Edit match dialog */}
      <MatchFormDialog
        open={!!editMatch}
        onOpenChange={(open) => !open && setEditMatch(null)}
        title="Editar Partida"
        match={editMatch}
        onSubmit={(formData) => editMatch && handleUpdate(editMatch.id, formData)}
        isPending={isPending}
        submitLabel="Salvar"
      />
    </div>
  );
}

// ==================== MATCH FORM DIALOG ====================

function MatchFormDialog({
  open,
  onOpenChange,
  title,
  match,
  onSubmit,
  isPending,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  match?: Match | null;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const allStages = [
    "Grupo A", "Grupo B", "Grupo C", "Grupo D",
    "Grupo E", "Grupo F", "Grupo G", "Grupo H",
    "Grupo I", "Grupo J", "Grupo K", "Grupo L",
    ...KNOCKOUT_STAGES,
  ];

  const defaultDatetime = match
    ? formatMatchDateTimeForInput(new Date(match.datetime))
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="teamA">Time A</Label>
                <Input
                  id="teamA"
                  name="teamA"
                  placeholder="Ex: Brasil"
                  defaultValue={match?.teamA ?? ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="teamB">Time B</Label>
                <Input
                  id="teamB"
                  name="teamB"
                  placeholder="Ex: Argentina"
                  defaultValue={match?.teamB ?? ""}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="datetime">Data e Hora (horário de São Paulo)</Label>
              <Input
                id="datetime"
                name="datetime"
                type="datetime-local"
                defaultValue={defaultDatetime}
                required
              />
            </div>
            <div>
              <Label htmlFor="groupStage">Fase / Grupo</Label>
              <select
                id="groupStage"
                name="groupStage"
                defaultValue={match?.groupStage ?? ""}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Selecione...</option>
                <optgroup label="Fase de Grupos">
                  {allStages.filter((s) => s.startsWith("Grupo")).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
                <optgroup label="Eliminatórias">
                  {KNOCKOUT_STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== TOURNAMENT TAB ====================

function TournamentTab({
  results,
  isPending,
  startTransition,
}: {
  results: TournamentResultData;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [scorerName, setScorerName] = useState(results.topScorer?.playerName ?? "");
  const [scorerGoals, setScorerGoals] = useState(results.topScorer?.totalGoals?.toString() ?? "");
  const [champion, setChampion] = useState(results.champion?.champion ?? "");
  const [runnerUp, setRunnerUp] = useState(results.champion?.runnerUp ?? "");
  const [finalScoreA, setFinalScoreA] = useState(results.champion?.finalScoreA?.toString() ?? "");
  const [finalScoreB, setFinalScoreB] = useState(results.champion?.finalScoreB?.toString() ?? "");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Artilheiro do Torneio
          </CardTitle>
          <CardDescription>
            Defina o artilheiro e quantidade de gols. Ao salvar, os pontos dos apostadores serão recalculados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scorer-name">Nome do Jogador</Label>
              <Input
                id="scorer-name"
                placeholder="Ex: Vinícius Jr"
                value={scorerName}
                onChange={(e) => setScorerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scorer-goals">Total de Gols</Label>
              <Input
                id="scorer-goals"
                type="number"
                min="0"
                placeholder="Ex: 5"
                value={scorerGoals}
                onChange={(e) => setScorerGoals(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">35 pts</Badge> Nome + gols corretos
            <Badge variant="outline">20 pts</Badge> Somente nome correto
          </div>
          <Button
            disabled={isPending || !scorerName.trim() || !scorerGoals}
            onClick={() => {
              startTransition(async () => {
                const res = await setTopScorerResult(scorerName.trim(), parseInt(scorerGoals));
                if (res.error) toast.error(res.error);
                else toast.success("Artilheiro definido e pontos recalculados!");
              });
            }}
          >
            {results.topScorer ? "Atualizar Artilheiro" : "Definir Artilheiro"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Resultado da Final
          </CardTitle>
          <CardDescription>
            Defina o campeão, vice e placar da final. Ao salvar, os pontos dos apostadores serão recalculados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="champion">Campeão</Label>
              <Input
                id="champion"
                placeholder="Ex: Brasil"
                value={champion}
                onChange={(e) => setChampion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="runner-up">Vice-Campeão</Label>
              <Input
                id="runner-up"
                placeholder="Ex: Argentina"
                value={runnerUp}
                onChange={(e) => setRunnerUp(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="final-score-a">Gols Campeão</Label>
              <Input
                id="final-score-a"
                type="number"
                min="0"
                placeholder="0"
                value={finalScoreA}
                onChange={(e) => setFinalScoreA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="final-score-b">Gols Vice</Label>
              <Input
                id="final-score-b"
                type="number"
                min="0"
                placeholder="0"
                value={finalScoreB}
                onChange={(e) => setFinalScoreB(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">90 pts</Badge> Campeão + placar + vice
            <Badge variant="outline">70 pts</Badge> Campeão + placar
            <Badge variant="outline">50 pts</Badge> Somente campeão
          </div>
          <Button
            disabled={isPending || !champion.trim() || !runnerUp.trim() || finalScoreA === "" || finalScoreB === ""}
            onClick={() => {
              startTransition(async () => {
                const res = await setChampionResult(
                  champion.trim(),
                  runnerUp.trim(),
                  parseInt(finalScoreA),
                  parseInt(finalScoreB)
                );
                if (res.error) toast.error(res.error);
                else toast.success("Resultado da final definido e pontos recalculados!");
              });
            }}
          >
            {results.champion ? "Atualizar Resultado" : "Definir Resultado"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== USERS TAB ====================

function UsersTab({
  users,
  guesses,
  isPending,
  startTransition,
}: {
  users: User[];
  guesses: Guess[];
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id ?? null);

  const selectedUserIdForView =
    selectedUserId && users.some((user) => user.id === selectedUserId)
      ? selectedUserId
      : users[0]?.id ?? null;

  const selectedUser = users.find((user) => user.id === selectedUserIdForView) ?? null;
  const selectedUserGuesses = guesses
    .filter((guess) => guess.userId === selectedUserIdForView)
    .sort((a, b) => new Date(b.match.datetime).getTime() - new Date(a.match.datetime).getTime());

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createUser(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuário criado!");
        setCreateDialogOpen(false);
      }
    });
  };

  const handleUpdate = (userId: string, formData: FormData) => {
    startTransition(async () => {
      const result = await updateUser(userId, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuário atualizado!");
        setEditUser(null);
      }
    });
  };

  const handleDelete = (userId: string) => {
    if (!confirm("Excluir este usuário? Todos os palpites serão perdidos.")) return;
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Usuário excluído.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Board de usuários</h3>
            <p className="text-sm text-muted-foreground">
              Clique em um usuário para ver os palpites dele.
            </p>
          </div>
          {selectedUser && (
            <Badge variant="outline">
              {selectedUserGuesses.length} palpites
            </Badge>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => {
            const isSelected = user.id === selectedUserIdForView;
            const userGuessesCount = guesses.filter((guess) => guess.userId === user.id).length;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {user.role === "ADMIN" ? (
                    <Badge className="bg-amber-600 text-white">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">Usuário</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pontos</span>
                  <span className="font-semibold">{user.totalPoints}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Palpites</span>
                  <span className="font-semibold">{userGuessesCount}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Palpites do usuário</h3>
            <p className="text-sm text-muted-foreground">
              {selectedUser ? `${selectedUser.name} · ${selectedUser.email}` : "Selecione um usuário no board"}
            </p>
          </div>
          {selectedUser && (
            <div className="flex gap-2">
              <Badge variant="outline">{selectedUser.totalPoints} pts</Badge>
              <Badge variant="outline">{selectedUserGuesses.length} palpites</Badge>
            </div>
          )}
        </div>

        {!selectedUser ? (
          <p className="text-sm text-muted-foreground">Nenhum usuário selecionado.</p>
        ) : selectedUserGuesses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este usuário ainda não fez palpites.</p>
        ) : (
          <div className="space-y-3">
            {selectedUserGuesses.map((guess) => {
              const isFinished = guess.match.status === "FINISHED";
              const points = guess.pointsEarned ?? 0;

              return (
                <div key={guess.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold">
                        {guess.match.teamA} vs {guess.match.teamB}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMatchDate(new Date(guess.match.datetime), "dd MMM")} · {formatMatchTime(new Date(guess.match.datetime))} · {guess.match.groupStage}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {guess.guessA} × {guess.guessB}
                      </Badge>
                      <Badge className={points === 25 ? "bg-green-600 text-white" : points > 0 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"}>
                        {isFinished ? `+${points} pts` : "Em aberto"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                      <p className="font-semibold">
                        {isFinished ? `${guess.match.scoreA} × ${guess.match.scoreB}` : "Ainda sem placar"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="font-semibold">{isFinished ? "Fechado" : "Aberto"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Pontos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.role === "ADMIN" ? (
                    <Badge className="bg-amber-600 text-white">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">Usuário</Badge>
                  )}
                </TableCell>
                <TableCell>{user.totalPoints}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditUser(user)}
                      disabled={isPending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {user.role !== "ADMIN" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(user.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create user dialog */}
      <UserFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Novo Usuário"
        onSubmit={handleCreate}
        isPending={isPending}
        submitLabel="Criar"
        requirePassword
      />

      {/* Edit user dialog */}
      <UserFormDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        title="Editar Usuário"
        user={editUser}
        onSubmit={(formData) => editUser && handleUpdate(editUser.id, formData)}
        isPending={isPending}
        submitLabel="Salvar"
      />
    </div>
  );
}

// ==================== GUESSES TAB ====================

function GuessesTab({ guesses }: { guesses: Guess[] }) {
  const totalGuesses = guesses.length;
  const closedGuesses = guesses.filter((guess) => guess.match.status === "FINISHED");
  const openGuesses = guesses.filter((guess) => guess.match.status !== "FINISHED");
  const totalPoints = guesses.reduce((sum, guess) => sum + (guess.pointsEarned ?? 0), 0);
  const exactHits = guesses.filter((guess) => guess.pointsEarned === 25).length;
  const positiveHits = guesses.filter((guess) => (guess.pointsEarned ?? 0) > 0).length;
  const uniqueUsers = new Set(guesses.map((guess) => guess.userId)).size;
  const [openUserId, setOpenUserId] = useState<string | null>(guesses[0]?.userId ?? null);

  const guessesByUser = guesses.reduce<Record<string, Guess[]>>((acc, guess) => {
    if (!acc[guess.userId]) {
      acc[guess.userId] = [];
    }
    acc[guess.userId].push(guess);
    return acc;
  }, {});

  const groupedUsers = guesses
    .map((guess) => guess.user)
    .filter((user, index, array) => array.findIndex((candidate) => candidate.id === user.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total de palpites</p>
          <p className="text-2xl font-bold font-display">{totalGuesses}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Usuários ativos</p>
          <p className="text-2xl font-bold font-display">{uniqueUsers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Palpites fechados</p>
          <p className="text-2xl font-bold font-display">{closedGuesses.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pontos somados</p>
          <p className="text-2xl font-bold font-display">{totalPoints}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline">{exactHits} exatos</Badge>
          <Badge variant="outline">{positiveHits} com pontos</Badge>
          <Badge variant="outline">{openGuesses.length} em aberto</Badge>
        </div>
      </Card>

      <Card>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Palpites por usuário</h3>
              <p className="text-sm text-muted-foreground">
                Clique em um usuário para expandir os palpites dele.
              </p>
            </div>
            <Badge variant="outline">{groupedUsers.length} usuários</Badge>
          </div>

          {groupedUsers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhum palpite registrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {groupedUsers.map((user) => {
                const userGuesses = (guessesByUser[user.id] ?? []).sort(
                  (a, b) => new Date(b.match.datetime).getTime() - new Date(a.match.datetime).getTime()
                );
                const isOpen = openUserId === user.id;
                const userPoints = userGuesses.reduce((sum, guess) => sum + (guess.pointsEarned ?? 0), 0);

                return (
                  <div key={user.id} className="overflow-hidden rounded-2xl border bg-card">
                    <button
                      type="button"
                      onClick={() => setOpenUserId(isOpen ? null : user.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                        isOpen && "border-b border-border bg-muted/30"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold truncate">{user.name}</p>
                          {user.role === "ADMIN" ? (
                            <Badge className="bg-amber-600 text-white">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">Usuário</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground">
                          <span>{userGuesses.length} palpites</span>
                          <span>{userPoints} pts somados</span>
                        </div>
                        <Badge variant="outline">{userGuesses.length} palpites</Badge>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="space-y-3 px-4 py-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground sm:hidden">
                          <span>{userGuesses.length} palpites</span>
                          <span>{userPoints} pts somados</span>
                        </div>

                        {userGuesses.length === 0 ? (
                          <p className="py-4 text-sm text-muted-foreground">Este usuário ainda não fez palpites.</p>
                        ) : (
                          userGuesses.map((guess) => {
                            const isFinished = guess.match.status === "FINISHED";
                            const points = guess.pointsEarned ?? 0;
                            const tone =
                              points === 25
                                ? "bg-green-600 text-white"
                                : points > 0
                                  ? "bg-amber-600 text-white"
                                  : "bg-muted text-muted-foreground";

                            return (
                              <div key={guess.id} className="rounded-xl border p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <p className="font-semibold">
                                      {guess.match.teamA} vs {guess.match.teamB}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatMatchDate(new Date(guess.match.datetime), "dd MMM")} · {formatMatchTime(new Date(guess.match.datetime))} · {guess.match.groupStage}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">
                                      {guess.guessA} × {guess.guessB}
                                    </Badge>
                                    <Badge className={tone}>{isFinished ? `+${points} pts` : "Em aberto"}</Badge>
                                  </div>
                                </div>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                                    <p className="font-semibold">
                                      {isFinished ? `${guess.match.scoreA} × ${guess.match.scoreB}` : "Ainda sem placar"}
                                    </p>
                                  </div>
                                  <div className="rounded-lg bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    <p className="font-semibold">{isFinished ? "Fechado" : "Aberto"}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ==================== USER FORM DIALOG ====================

function UserFormDialog({
  open,
  onOpenChange,
  title,
  user,
  onSubmit,
  isPending,
  submitLabel,
  requirePassword,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  user?: User | null;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  submitLabel: string;
  requirePassword?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        key={`${title}-${user?.id ?? "new"}`}
        className="overflow-hidden rounded-3xl border p-0 shadow-2xl max-w-[calc(100%-1rem)] sm:max-w-xl lg:max-w-2xl"
      >
        <DialogHeader className="border-b bg-muted/30 px-4 py-5 text-left sm:px-6">
          <DialogTitle className="font-display text-xl leading-tight">{title}</DialogTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Preencha os dados abaixo para criar ou atualizar o usuário.
          </p>
        </DialogHeader>
        <form action={onSubmit}>
          <div className="grid gap-5 px-4 py-5 sm:grid-cols-2 sm:px-6 sm:py-6">
            <div className="space-y-2.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                placeholder="Nome completo"
                defaultValue={user?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@exemplo.com"
                defaultValue={user?.email ?? ""}
                required
              />
            </div>
            <div className="space-y-2.5 sm:col-span-2">
              <Label htmlFor="password">
                Senha{!requirePassword && " (deixe em branco para manter)"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={requirePassword ? "Mín. 6 caracteres" : "••••••"}
                  className="h-11 px-4 pr-12 text-base"
                  required={requirePassword}
                  minLength={requirePassword ? 6 : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2.5 sm:col-span-2">
              <Label htmlFor="confirmPassword">
                Confirmar senha{!requirePassword && " (deixe em branco para manter)"}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={requirePassword ? "Repita a senha" : "••••••"}
                  className="h-11 px-4 pr-12 text-base"
                  required={requirePassword}
                  minLength={requirePassword ? 6 : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Visualizar confirmação de senha"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2.5 sm:col-span-2">
              <Label htmlFor="role">Papel</Label>
              <select
                id="role"
                name="role"
                defaultValue={user?.role ?? "USER"}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter className="border-t bg-muted/20 px-4 py-4 sm:px-6 sm:py-5 mx-0! mb-0! gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending ? "Salvando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
