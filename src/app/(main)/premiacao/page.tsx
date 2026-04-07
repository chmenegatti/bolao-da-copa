import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Banknote,
  Coins,
  Crown,
  Medal,
  Scale,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

const payoutExamples = [
  {
    title: "Exemplo 1",
    pool: "R$ 1.000,00",
    entries: "20 participantes x R$ 50",
    first: "R$ 700,00",
    second: "R$ 200,00",
    third: "R$ 100,00",
  },
  {
    title: "Exemplo 2",
    pool: "R$ 2.500,00",
    entries: "50 participantes x R$ 50",
    first: "R$ 1.750,00",
    second: "R$ 500,00",
    third: "R$ 250,00",
  },
  {
    title: "Exemplo 3",
    pool: "R$ 5.000,00",
    entries: "100 participantes x R$ 50",
    first: "R$ 3.500,00",
    second: "R$ 1.000,00",
    third: "R$ 500,00",
  },
];

const tiebreakers = [
  "Maior pontuação total no ranking.",
  "Maior número de placares exatos de partidas (25 pts).",
  "Maior número de palpites de 20 pontos, acertando vencedor + gols de um time.",
  "Maior soma de pontos nas apostas especiais de artilheiro e campeão.",
  "Persistindo o empate, vence quem entrou primeiro no bolão.",
];

export default function PrizePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Premiação</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Modelo Top Heavy: a maior fatia vai para quem chegar no topo. O objetivo
          é premiar forte o campeão, manter o vice bem recompensado e ainda reservar
          um incentivo para o terceiro lugar. 🏆
        </p>
      </div>

      <Card className="border-emerald-200/70 bg-linear-to-br from-emerald-50 via-white to-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-700" />
            Modelo Top Heavy 🥇🥈🥉
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Nesse formato, o <strong className="text-foreground">1º lugar</strong> leva a
              maior parte do prize pool. Isso deixa a disputa pelo topo mais intensa até a
              rodada final e valoriza quem teve o melhor desempenho geral.
            </p>
            <p>
              O modelo também evita uma pulverização excessiva do prêmio. Em vez de pagar
              pouca coisa para muita gente, ele concentra melhor os valores nas posições do
              pódio. 💸
            </p>
            <p>
              O prize pool é formado pela soma das inscrições pagas. Quanto mais participantes
              confirmados, maior a premiação final. 👥
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Distribuição Oficial
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                <span className="font-semibold text-amber-950">🥇 1º lugar</span>
                <span className="text-lg font-bold text-amber-700">70%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-800">🥈 2º lugar</span>
                <span className="text-lg font-bold text-slate-600">20%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
                <span className="font-semibold text-orange-900">🥉 3º lugar</span>
                <span className="text-lg font-bold text-orange-700">10%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Quanto cada colocado recebe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A conta é sempre feita sobre o valor total arrecadado. Abaixo estão alguns cenários
            didáticos para você visualizar o modelo na prática. ✨
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            {payoutExamples.map((example) => (
              <div key={example.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{example.title}</p>
                    <p className="text-xs text-muted-foreground">{example.entries}</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                    {example.pool}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>🥇 Campeão</span>
                    <strong>{example.first}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🥈 Vice</span>
                    <strong>{example.second}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🥉 Terceiro</span>
                    <strong>{example.third}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Critérios de desempate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Se dois ou mais participantes terminarem empatados em pontos, a ordem final da
              premiação seguirá estes critérios, exatamente nessa sequência: 📊
            </p>

            <ol className="space-y-3">
              {tiebreakers.map((criterion, index) => (
                <li key={criterion} className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {index + 1}
                  </div>
                  <span>{criterion}</span>
                </li>
              ))}
            </ol>

            <div className="rounded-xl bg-muted px-4 py-3 text-muted-foreground">
              Se ainda assim houver empate absoluto após todos os critérios acima, a organização
              pode dividir o valor da faixa premiada entre os empatados. 🤝
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Regras práticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p>
                O prize pool considera apenas inscrições <strong className="text-foreground">confirmadas</strong>.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
              <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p>
                Os valores mostrados nesta página são <strong className="text-foreground">exemplos</strong>.
                O número final depende da arrecadação real do bolão.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
              <Medal className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p>
                A premiação oficial olha para o ranking final já com todos os jogos e apostas
                especiais apurados.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3">
              <Crown className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p>
                Apostas especiais podem decidir o campeão do bolão e também pesar no desempate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}