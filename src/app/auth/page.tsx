"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Target,
  Trophy,
  Crown,
  Crosshair,
  Eye,
  EyeOff,
  DollarSign,
  Medal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Award,
} from "lucide-react";
import { signUp, login } from "@/app/actions/auth";
import { toast } from "sonner";

type TabType = "scoring" | "prize";

function InfoPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("scoring");
  const [expandedSection, setExpandedSection] = useState<string>("match");

  const toggleSection = (name: string) => {
    setExpandedSection((prev) => (prev === name ? "" : name));
  };

  const scoringItems = [
    {
      icon: Target,
      iconBg: "bg-gold/20",
      pts: "25",
      ptsColor: "text-gold",
      title: "Placar Exato",
      desc: "Acertou o placar completo da partida",
      highlight: true,
    },
    {
      icon: Trophy,
      iconBg: "bg-gold/20",
      pts: "20",
      ptsColor: "text-gold",
      title: "Vencedor + Gols de 1 Time",
      desc: "Acertou quem venceu e os gols de um dos times",
      highlight: true,
    },
    {
      icon: Star,
      iconBg: "bg-white/10",
      pts: "18",
      ptsColor: "text-white/70",
      title: "Empate Nao Exato",
      desc: "Acertou que empatou, mas errou o numero de gols",
      highlight: false,
    },
    {
      icon: Star,
      iconBg: "bg-white/10",
      pts: "15",
      ptsColor: "text-white/70",
      title: "Vencedor Seco",
      desc: "Acertou so quem venceu, mas errou os placares",
      highlight: false,
    },
    {
      icon: Zap,
      iconBg: "bg-white/10",
      pts: "5",
      ptsColor: "text-white/70",
      title: "Gols de um Time (Venc. Errado)",
      desc: "Errou o vencedor, mas acertou os gols de um time",
      highlight: false,
    },
  ];

  const bonusItems = [
    {
      icon: Crosshair,
      iconBg: "bg-gold/20",
      pts: "35 ou 20",
      ptsColor: "text-gold",
      title: "Artilheiro",
      desc: "35 = jogador + gols, 20 = apenas jogador",
      highlight: true,
    },
    {
      icon: Crown,
      iconBg: "bg-gold/20",
      pts: "90, 70 ou 50",
      ptsColor: "text-gold",
      title: "Campeao",
      desc: "90 = campeao + placar + vice, 70 = campeao + placar, 50 = so campeao",
      highlight: true,
    },
  ];

  return (
    <div className="w-full min-h-112">
      <div className="mb-4 flex rounded-lg bg-white/5 p-1">
        <button
          onClick={() => setActiveTab("scoring")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm md:text-base xl:text-lg font-medium transition-all ${activeTab === "scoring"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-white/50 hover:text-white/80"
            }`}
        >
          <Star className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          Pontuacao
        </button>
        <button
          onClick={() => setActiveTab("prize")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm md:text-base xl:text-lg font-medium transition-all ${activeTab === "prize"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-white/50 hover:text-white/80"
            }`}
        >
          <Award className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          Premiacao
        </button>
      </div>

      {activeTab === "scoring" && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => toggleSection("match")}
              className="w-full flex items-center justify-between p-3 md:p-4 xl:p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 xl:h-5 xl:w-5 text-gold" />
                <span className="text-sm md:text-base xl:text-lg font-semibold">
                  Pontuacao por Partida
                </span>
              </div>
              {expandedSection === "match" ? (
                <ChevronUp className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              )}
            </button>
            {expandedSection === "match" && (
              <div className="space-y-3 px-3 pb-3 md:px-4 md:pb-4 xl:px-5 xl:pb-5">
                {scoringItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className={`flex h-5 w-5 md:h-6 md:w-6 xl:h-7 xl:w-7 shrink-0 items-center justify-center rounded-full ${item.iconBg} mt-0.5`}
                    >
                      <item.icon
                        className={`h-2.5 w-2.5 md:h-3 md:w-3 xl:h-4 xl:w-4 ${item.iconBg.includes("gold") ? "text-gold" : "text-white/60"
                          }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm md:text-[15px] xl:text-[17px] font-semibold">
                        <span className={item.ptsColor}>{item.pts} pts</span>{" "}
                        <span className={item.highlight ? "text-white/90" : "text-white/80"}>
                          {item.title}
                        </span>
                      </p>
                      <p className="text-xs md:text-[13px] xl:text-[15px] text-white/40 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => toggleSection("bonus")}
              className="w-full flex items-center justify-between p-3 md:p-4 xl:p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 xl:h-5 xl:w-5 text-gold" />
                <span className="text-sm md:text-base xl:text-lg font-semibold">
                  Bonus Especiais
                </span>
              </div>
              {expandedSection === "bonus" ? (
                <ChevronUp className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              )}
            </button>
            {expandedSection === "bonus" && (
              <div className="space-y-3 px-3 pb-3 md:px-4 md:pb-4 xl:px-5 xl:pb-5">
                {bonusItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className={`flex h-5 w-5 md:h-6 md:w-6 xl:h-7 xl:w-7 shrink-0 items-center justify-center rounded-full ${item.iconBg} mt-0.5`}
                    >
                      <item.icon
                        className={`h-2.5 w-2.5 md:h-3 md:w-3 xl:h-4 xl:w-4 ${item.iconBg.includes("gold") ? "text-gold" : "text-white/60"
                          }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm md:text-[15px] xl:text-[17px] font-semibold">
                        <span className={item.ptsColor}>{item.pts} pts</span>{" "}
                        <span className="text-white/90">{item.title}</span>
                      </p>
                      <p className="text-xs md:text-[13px] xl:text-[15px] text-white/40 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "prize" && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => toggleSection("distribution")}
              className="w-full flex items-center justify-between p-3 md:p-4 xl:p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 xl:h-5 xl:w-5 text-gold" />
                <span className="text-sm md:text-base xl:text-lg font-semibold">
                  Distribuicao do Premio
                </span>
              </div>
              {expandedSection === "distribution" ? (
                <ChevronUp className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              )}
            </button>
            {expandedSection === "distribution" && (
              <div className="space-y-3 px-3 pb-3 md:px-4 md:pb-4 xl:px-5 xl:pb-5">
                <p className="text-xs md:text-sm xl:text-base text-white/50 mb-2">
                  Modelo Top Heavy, quem fica em 1o leva a maior fatia.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-gold/10 p-2.5 md:p-3 xl:p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base md:text-lg xl:text-xl">🥇</span>
                      <span className="text-sm md:text-base xl:text-lg font-semibold">1o Lugar</span>
                    </div>
                    <span className="text-base md:text-lg xl:text-xl font-bold text-gold">70%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2.5 md:p-3 xl:p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base md:text-lg xl:text-xl">🥈</span>
                      <span className="text-sm md:text-base xl:text-lg font-semibold">2o Lugar</span>
                    </div>
                    <span className="text-sm md:text-base xl:text-lg font-bold text-white/70">20%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-amber-700/20 bg-amber-700/10 p-2.5 md:p-3 xl:p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base md:text-lg xl:text-xl">🥉</span>
                      <span className="text-sm md:text-base xl:text-lg font-semibold">3o Lugar</span>
                    </div>
                    <span className="text-sm md:text-base xl:text-lg font-bold text-amber-400">10%</span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 md:p-3 xl:p-4">
                  <p className="text-[11px] md:text-xs xl:text-sm text-white/50">
                    Exemplo: prize pool de R$1.000, 1o: R$700, 2o: R$200, 3o: R$100.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => toggleSection("payment")}
              className="w-full flex items-center justify-between p-3 md:p-4 xl:p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 xl:h-5 xl:w-5 text-gold" />
                <span className="text-sm md:text-base xl:text-lg font-semibold">
                  Como Funciona o Pagamento
                </span>
              </div>
              {expandedSection === "payment" ? (
                <ChevronUp className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              )}
            </button>
            {expandedSection === "payment" && (
              <div className="space-y-3 px-3 pb-3 md:px-4 md:pb-4 xl:px-5 xl:pb-5">
                {[
                  { emoji: "📅", q: "Quando?", a: "Ate 7 dias uteis apos o fim da Copa" },
                  { emoji: "💳", q: "Como?", a: "Transferencia via PIX" },
                  {
                    emoji: "✅",
                    q: "Requisitos",
                    a: "Pagamento confirmado e cadastro atualizado",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-sm xl:text-base">{item.emoji}</span>
                    <div>
                      <p className="text-xs md:text-sm xl:text-base font-medium text-white/80">{item.q}</p>
                      <p className="text-[11px] md:text-xs xl:text-sm text-white/50">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => toggleSection("tiebreak")}
              className="w-full flex items-center justify-between p-3 md:p-4 xl:p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Medal className="h-4 w-4 xl:h-5 xl:w-5 text-gold" />
                <span className="text-sm md:text-base xl:text-lg font-semibold">
                  Criterios de Desempate
                </span>
              </div>
              {expandedSection === "tiebreak" ? (
                <ChevronUp className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              ) : (
                <ChevronDown className="h-4 w-4 xl:h-5 xl:w-5 text-white/50" />
              )}
            </button>
            {expandedSection === "tiebreak" && (
              <div className="space-y-2 px-3 pb-3 md:px-4 md:pb-4 xl:px-5 xl:pb-5">
                {[
                  "Mais placares exatos de partida (25 pts)",
                  "Mais acertos de vencedor + gols de um time (20 pts)",
                  "Maior soma nas apostas especiais",
                  "Persistindo empate: quem entrou primeiro no bolao",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 xl:h-6 xl:w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] xl:text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <p className="text-xs md:text-sm xl:text-base text-white/60">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (formData: FormData) => {
    setError(null);

    if (!isLogin) {
      const password = (formData.get("password") as string | null) ?? "";
      const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

      if (password !== confirmPassword) {
        const message = "As senhas nao coincidem.";
        setError(message);
        toast.error(message);
        return;
      }
    }

    startTransition(async () => {
      if (isLogin) {
        const result = await login(formData);
        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
        }
      } else {
        const result = await signUp(formData);
        if (result?.error) {
          setError(result.error);
          toast.error(result.error);
        } else if (result?.success) {
          toast.success("Conta criada! Faca login.");
          setIsLogin(true);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden">
        <div className="bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-950 px-4 pt-6 pb-4 text-white">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary ring-1 ring-primary/50 shadow-lg shadow-primary/20">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight">Palpite Perfeito</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Copa do Mundo 2026</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 text-foreground shadow-xl">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold">{isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin
                  ? "Acesse sua conta para ver seus palpites"
                  : "Registre-se para comecar a apostar"}
              </p>
            </div>

            <form action={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nome</label>
                  <Input id="name" name="name" placeholder="Seu nome" className="h-11" required={!isLogin} />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</label>
                <Input id="email" name="email" type="email" placeholder="seu@email.com" className="h-11" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Senha</label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "........" : "Min. 6 caracteres"}
                    className="h-11 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confirmar Senha</label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      className="h-11 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Ocultar" : "Visualizar"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-center text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="h-11 w-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <Separator className="my-5" />

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Nao tem conta?" : "Ja tem conta?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setShowPassword(false);
                  setShowConfirmPassword(false);
                }}
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? "Criar conta" : "Entrar"}
              </button>
            </p>
          </div>
        </div>

        <div className="bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-950 px-4 pb-6 text-white">
          <InfoPanel />
        </div>
      </div>

      <div className="hidden bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-950 lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:py-8">
        <div className="flex w-full overflow-hidden rounded-2xl shadow-2xl xl:max-w-[60%]">
          <div className="lg:w-3/5 flex flex-col bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 text-white xl:p-10">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary ring-1 ring-primary/50 shadow-lg shadow-primary/20 xl:h-12 xl:w-12">
                <Trophy className="h-5 w-5 text-primary-foreground xl:h-6 xl:w-6" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight xl:text-2xl">Palpite Perfeito</h1>
                <p className="text-[10px] uppercase tracking-widest text-white/50 xl:text-xs">Copa do Mundo 2026</p>
              </div>
            </div>

            <p className="mb-6 max-w-lg text-sm text-white/60 xl:text-base">
              De seus palpites nas partidas da Copa e dispute com seus amigos!
            </p>

            <div className="flex-1 overflow-hidden">
              <InfoPanel />
            </div>
          </div>

          <div className="lg:w-2/5 flex items-center justify-center bg-background p-8 xl:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <h2 className="font-display text-2xl font-bold xl:text-3xl">{isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}</h2>
                <p className="mt-2 text-base text-muted-foreground xl:text-lg">
                  {isLogin
                    ? "Acesse sua conta para ver seus palpites"
                    : "Registre-se para comecar a apostar"}
                </p>
              </div>

              <form action={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs xl:text-sm font-medium uppercase tracking-wide text-muted-foreground">Nome</label>
                    <Input id="name" name="name" placeholder="Seu nome" className="h-12 text-base xl:text-lg" required={!isLogin} />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs xl:text-sm font-medium uppercase tracking-wide text-muted-foreground">Email</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="h-12 text-base xl:text-lg"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs xl:text-sm font-medium uppercase tracking-wide text-muted-foreground">Senha</label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isLogin ? "........" : "Min. 6 caracteres"}
                      className="h-12 text-base xl:text-lg pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs xl:text-sm font-medium uppercase tracking-wide text-muted-foreground">Confirmar Senha</label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        className="h-12 text-base xl:text-lg pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "Ocultar" : "Visualizar"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className="text-center text-sm xl:text-base text-destructive">{error}</p>}

                <Button
                  type="submit"
                  className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 xl:text-lg"
                  disabled={isPending}
                >
                  {isPending ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
                </Button>
              </form>

              <Separator className="my-6" />

              <p className="text-center text-sm text-muted-foreground xl:text-base">
                {isLogin ? "Nao tem conta?" : "Ja tem conta?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  {isLogin ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
