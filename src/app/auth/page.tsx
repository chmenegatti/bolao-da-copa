"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Star, Target, Trophy, CheckCircle2 } from "lucide-react";
import { signUp, login } from "@/app/actions/auth";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
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

          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-gold">
              Sistema de Pontuação
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold">25 pontos - Placar Exato</p>
                  <p className="text-sm text-white/60">
                    Acertou o placar exato da partida
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold">
                    18 pontos - Vencedor + Saldo
                  </p>
                  <p className="text-sm text-white/60">
                    Acertou quem venceu e o saldo de gols
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <p className="font-semibold">10 pontos - Vencedor</p>
                  <p className="text-sm text-white/60">
                    Acertou apenas quem venceu ou empate
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Auth form */}
        <Card className="p-8">
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

          <form action={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Seu nome"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={isLogin ? "Sua senha" : "Mín. 6 caracteres"}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
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
