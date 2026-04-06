import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Crown,
  Crosshair,
  CheckCircle2,
  Clock,
  Info,
  Star,
  TrendingUp,
} from "lucide-react";

function PointsBadge({
  points,
  variant = "default",
}: {
  points: number;
  variant?: "gold" | "silver" | "bronze" | "default";
}) {
  const colors = {
    gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
    silver: "bg-slate-100 text-slate-700 border-slate-300",
    bronze: "bg-orange-100 text-orange-800 border-orange-300",
    default: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold border ${colors[variant]}`}
    >
      <Star className="h-3 w-3" />
      {points} pts
    </span>
  );
}

function ExampleCard({
  label,
  real,
  guess,
  points,
  description,
  variant,
}: {
  label: string;
  real: string;
  guess: string;
  points: number;
  description: string;
  variant: "gold" | "silver" | "bronze" | "default";
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <PointsBadge points={points} variant={variant} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
          <span>Resultado: <strong className="text-foreground">{real}</strong></span>
          <span>Palpite: <strong className="text-foreground">{guess}</strong></span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Como Funciona</h1>
        <p className="text-muted-foreground mt-1">
          Tudo que você precisa saber para jogar e pontuar bem no Palpite Perfeito
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            O Bolão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            O <strong>Palpite Perfeito</strong> é um bolão da Copa onde você tenta adivinhar os
            resultados das partidas, o artilheiro e o campeão do torneio. Quem acumular
            mais pontos ao final vence!
          </p>
          <p>
            Há três formas de pontuar: <strong>palpites de partidas</strong>,{" "}
            <strong>aposta no artilheiro</strong> e <strong>aposta no campeão</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Match guesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Palpites de Partidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Para cada partida, você escolhe o placar que acha que vai acontecer. A pontuação
            segue esta ordem:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="text-center p-4 rounded-lg border-2 border-yellow-300 bg-yellow-50">
              <PointsBadge points={25} variant="gold" />
              <p className="font-bold mt-2 text-sm">Placar Exato</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou o placar completo da partida</p>
            </div>
            <div className="text-center p-4 rounded-lg border-2 border-slate-300 bg-slate-50">
              <PointsBadge points={20} variant="silver" />
              <p className="font-bold mt-2 text-sm">Vencedor + Gols de 1 Time</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou quem venceu e o número exato de gols de um dos times</p>
            </div>
            <div className="text-center p-4 rounded-lg border-2 border-orange-300 bg-orange-50">
              <PointsBadge points={15} variant="bronze" />
              <p className="font-bold mt-2 text-sm">Vencedor Seco</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou só quem venceu, mas errou os placares</p>
            </div>
            <div className="text-center p-4 rounded-lg border-2 border-blue-300 bg-blue-50">
              <PointsBadge points={18} variant="default" />
              <p className="font-bold mt-2 text-sm">Empate Não Exato</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou que empatou, mas errou o número de gols dos dois times</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="text-center p-4 rounded-lg border-2 border-emerald-300 bg-emerald-50">
              <PointsBadge points={5} variant="default" />
              <p className="font-bold mt-2 text-sm">Gols de um Time com Vencedor Errado</p>
              <p className="text-xs text-muted-foreground mt-1">Errou o vencedor, mas acertou um placar exato de um time</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Exemplos:</p>
            <div className="space-y-2">
              <ExampleCard
                label="Brasil 2 × 1 Argentina"
                real="2 × 1"
                guess="2 × 1"
                points={25}
                description="Placar idêntico. Máxima pontuação!"
                variant="gold"
              />
              <ExampleCard
                label="Brasil 2 × 1 Argentina"
                real="2 × 1"
                guess="3 × 1"
                points={20}
                description="Vencedor correto e um dos placares exatos. 20 pontos."
                variant="silver"
              />
              <ExampleCard
                label="Brasil 2 × 1 Argentina"
                real="2 × 1"
                guess="4 × 2"
                points={15}
                description="Acertou só quem venceu, mas errou os placares."
                variant="bronze"
              />
              <ExampleCard
                label="Brasil 2 × 2 Argentina"
                real="2 × 2"
                guess="1 × 1"
                points={18}
                description="Acertou que empatou, mas errou o número de gols dos dois times."
                variant="default"
              />
              <ExampleCard
                label="Coritiba 1 × 1 Fluminense"
                real="1 × 1"
                guess="1 × 3"
                points={5}
                description="Errou o vencedor, mas acertou um dos placares. 5 pontos."
                variant="default"
              />
              <ExampleCard
                label="Brasil 2 × 1 Argentina"
                real="2 × 1"
                guess="0 × 2"
                points={0}
                description="Palpitou que a Argentina ganharia. Errou o vencedor — zero pontos."
                variant="default"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              O prazo para enviar ou alterar um palpite é até <strong>10 minutos antes</strong> do
              início da partida. Depois disso, o palpite fica bloqueado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top scorer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            Aposta no Artilheiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Uma única aposta por participante: você escolhe o jogador que acredita que vai
            marcar mais gols na Copa e quantos gols ele vai fazer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="text-center p-4 rounded-lg border-2 border-yellow-300 bg-yellow-50">
              <PointsBadge points={35} variant="gold" />
              <p className="font-bold mt-2 text-sm">Nome + Gols Corretos</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou o jogador e a quantidade exata de gols</p>
            </div>
            <div className="text-center p-4 rounded-lg border-2 border-slate-300 bg-slate-50">
              <PointsBadge points={20} variant="silver" />
              <p className="font-bold mt-2 text-sm">Apenas o Nome</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou o artilheiro, mas errou a quantidade de gols</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Exemplos:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <PointsBadge points={35} variant="gold" />
                <div>
                  <p className="font-semibold text-sm">Artilheiro: Vinícius Jr, 6 gols</p>
                  <p className="text-sm text-muted-foreground">
                    Palpite: <strong className="text-foreground">Vinícius Jr, 6 gols</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Nome e número de gols idênticos. 35 pontos!</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <PointsBadge points={20} variant="silver" />
                <div>
                  <p className="font-semibold text-sm">Artilheiro: Vinícius Jr, 6 gols</p>
                  <p className="text-sm text-muted-foreground">
                    Palpite: <strong className="text-foreground">Vinícius Jr, 4 gols</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Nome correto, mas errou o número de gols. 20 pontos.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <PointsBadge points={0} variant="default" />
                <div>
                  <p className="font-semibold text-sm">Artilheiro: Vinícius Jr, 6 gols</p>
                  <p className="text-sm text-muted-foreground">
                    Palpite: <strong className="text-foreground">Mbappé, 6 gols</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Errou o jogador. Nenhum ponto.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Champion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Aposta no Campeão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Uma única aposta por participante: você escolhe o campeão, o vice-campeão e o
            placar da grande final.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-lg border-2 border-yellow-300 bg-yellow-50">
              <PointsBadge points={90} variant="gold" />
              <p className="font-bold mt-2 text-sm">Tudo Certo</p>
              <p className="text-xs text-muted-foreground mt-1">Campeão + placar da final + vice-campeão</p>
            </div>
            <div className="text-center p-4 rounded-lg border-2 border-slate-300 bg-slate-50">
              <PointsBadge points={70} variant="silver" />
              <p className="font-bold mt-2 text-sm">Campeão + Placar</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou o campeão e o placar, mas errou o vice</p>
            </div>
            <div className="text-center p-4 rounded-lg border-2 border-orange-300 bg-orange-50">
              <PointsBadge points={50} variant="bronze" />
              <p className="font-bold mt-2 text-sm">Só o Campeão</p>
              <p className="text-xs text-muted-foreground mt-1">Acertou apenas quem foi campeão</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold">Exemplos:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <PointsBadge points={90} variant="gold" />
                <div>
                  <p className="font-semibold text-sm">Final: Brasil 3 × 1 Argentina</p>
                  <p className="text-sm text-muted-foreground">
                    Palpite: <strong className="text-foreground">Brasil campeão, 3 × 1, vice Argentina</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Acertou tudo. 90 pontos!</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <PointsBadge points={70} variant="silver" />
                <div>
                  <p className="font-semibold text-sm">Final: Brasil 3 × 1 Argentina</p>
                  <p className="text-sm text-muted-foreground">
                    Palpite: <strong className="text-foreground">Brasil campeão, 3 × 1, vice França</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Campeão e placar corretos, mas errou o vice. 70 pontos.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <PointsBadge points={50} variant="bronze" />
                <div>
                  <p className="font-semibold text-sm">Final: Brasil 3 × 1 Argentina</p>
                  <p className="text-sm text-muted-foreground">
                    Palpite: <strong className="text-foreground">Brasil campeão, 2 × 0, vice França</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Acertou o campeão, mas errou placar e vice. 50 pontos.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                <PointsBadge points={0} variant="default" />
                <div>
                  <p className="font-semibold text-sm">Final: Brasil 3 × 1 Argentina</p>
                  <p className="text-sm text-muted-foreground">
                    Palpite: <strong className="text-foreground">França campeão, 2 × 1, vice Alemanha</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Errou o campeão. Nenhum ponto.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resumo da Pontuação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold">Situação</th>
                  <th className="text-right py-2 font-semibold">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4">Placar exato da partida</td>
                  <td className="py-2 text-right"><PointsBadge points={25} variant="gold" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Vencedor + gols de 1 time corretos</td>
                  <td className="py-2 text-right"><PointsBadge points={20} variant="silver" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Empate não exato</td>
                  <td className="py-2 text-right"><PointsBadge points={18} variant="default" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Apenas vencedor, sem placares exatos</td>
                  <td className="py-2 text-right"><PointsBadge points={15} variant="bronze" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Gols de um time com vencedor errado</td>
                  <td className="py-2 text-right"><PointsBadge points={5} variant="default" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Artilheiro: nome + gols corretos</td>
                  <td className="py-2 text-right"><PointsBadge points={35} variant="gold" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Artilheiro: apenas nome correto</td>
                  <td className="py-2 text-right"><PointsBadge points={20} variant="silver" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Final: campeão + placar + vice corretos</td>
                  <td className="py-2 text-right"><PointsBadge points={90} variant="gold" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Final: campeão + placar corretos</td>
                  <td className="py-2 text-right"><PointsBadge points={70} variant="silver" /></td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Final: apenas campeão correto</td>
                  <td className="py-2 text-right"><PointsBadge points={50} variant="bronze" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Dicas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong>Não espere a última hora.</strong> Os palpites fecham 10 minutos antes do
                apito inicial. Se você perder o prazo, não pontua na partida.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong>Você pode alterar o palpite</strong> quantas vezes quiser antes do prazo.
                Só o último enviado é contabilizado.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong>As apostas especiais valem muito.</strong> Um palpite perfeito de
                artilheiro (35 pts) equivale a mais de um jogo com placar exato (25 pts).
                O campeão completo (90 pts) equivale a quase quatro placares exatos!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong>Os pontos são calculados automaticamente</strong> assim que o admin
                lança o resultado de cada partida ou das apostas especiais.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>
                <strong>Acompanhe o ranking</strong> em tempo real na página de Ranking para
                saber como você está em relação aos outros participantes.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
