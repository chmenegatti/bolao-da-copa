"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Target,
  Trophy,
  CheckCircle2,
  Crown,
  Crosshair,
  Eye,
  EyeOff,
} from "lucide-react";
import { signUp, login } from "@/app/actions/auth";
import { toast } from "sonner";

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
        const message = "As senhas não coincidem.";
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
          toast.success("Conta criada! Faça login.");
          setIsLogin(true);
        }
      }
    });
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8">
        {/* Left - Branding & Rules */}
        <div className="hidden lg:flex flex-col justify-center text-white">
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-10 w-10 text-gold" />
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Palpite Perfeito
            </h1>
          </div>
          <p className="text-lg text-white/80 mb-8">
            Dê seus palpites nas partidas da Copa e dispute com seus amigos!
          </p>

          <div className="space-y-5">
            <h3 className="font-display text-lg font-semibold text-gold">
              Sistema de Pontuação
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold">25 pontos - Placar Exato</p>
                  <p className="text-sm text-white/60">
                    Acertou o placar completo da partida
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold">20 pontos - Vencedor + Gols de 1 Time</p>
                  <p className="text-sm text-white/60">
                    Acertou quem venceu e o número exato de gols de um dos times
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="font-semibold">15 pontos - Vencedor Seco</p>
                  <p className="text-sm text-white/60">Acertou só quem venceu, mas errou os placares</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="font-semibold">18 pontos - Empate Não Exato</p>
                  <p className="text-sm text-white/60">Acertou que empatou, mas errou o número de gols dos dois times</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="font-semibold">5 pontos - Gols de um Time com Vencedor Errado</p>
                  <p className="text-sm text-white/60">
                    Errou o vencedor, mas acertou os gols de um time que não venceu
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Crosshair className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold">Artilheiro: 35 ou 20 pontos</p>
                  <p className="text-sm text-white/60">
                    35 = jogador + gols, 20 = apenas jogador
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold">Campeão: 90, 70 ou 50 pontos</p>
                  <p className="text-sm text-white/60">
                    90 = campeão + placar + vice, 70 = campeão + placar, 50 = só campeão
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Auth form */}
        <Card className="p-8 lg:p-10">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <Star className="h-7 w-7 text-gold" />
            <h1 className="font-display text-2xl font-bold">
              Palpite Perfeito
            </h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="font-display text-2xl font-bold">
              {isLogin ? "Entrar" : "Criar Conta"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {isLogin
                ? "Acesse sua conta para ver seus palpites"
                : "Crie sua conta para começar a apostar"}
            </p>
          </div>

          <form action={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Seu nome"
                  className="h-11 px-4 text-base"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                className="h-11 px-4 text-base"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "Sua senha" : "Mín. 6 caracteres"}
                  className="h-11 px-4 pr-12 text-base"
                  required
                  minLength={6}
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

            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    className="h-11 px-4 pr-12 text-base"
                    required
                    minLength={6}
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
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-11 text-base" disabled={isPending}>
              {isPending
                ? "Aguarde..."
                : isLogin
                  ? "Entrar"
                  : "Criar Conta"}
            </Button>
          </form>

          <Separator className="my-6" />

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
