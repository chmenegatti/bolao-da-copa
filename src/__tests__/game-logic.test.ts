import { describe, it, expect } from "vitest";
import { calculateGuessPoints } from "@/lib/game-logic";

describe("calculateGuessPoints", () => {
  // ── 25 pts: placar exato ────────────────────────────────────────────────
  it("retorna 25 para placar exato", () => {
    expect(calculateGuessPoints(2, 1, 2, 1)).toBe(25);
  });

  it("retorna 25 para empate exato (0×0)", () => {
    expect(calculateGuessPoints(0, 0, 0, 0)).toBe(25);
  });

  it("retorna 25 para placar exato com gols altos", () => {
    expect(calculateGuessPoints(3, 3, 3, 3)).toBe(25);
  });

  // ── 18 pts: vencedor + mesmo saldo ─────────────────────────────────────
  it("retorna 18 para vencedor correto com mesmo saldo de gols", () => {
    // 3-1 vs 2-0: ambos vitória do A com +2 de saldo
    expect(calculateGuessPoints(3, 1, 2, 0)).toBe(18);
  });

  it("retorna 18 para vitória do B com mesmo saldo", () => {
    // 0-2 vs 1-3: ambos vitória do B com -2
    expect(calculateGuessPoints(0, 2, 1, 3)).toBe(18);
  });

  // ── 10 pts: apenas vencedor/empate ─────────────────────────────────────
  it("retorna 10 para vencedor correto sem acertar o saldo", () => {
    expect(calculateGuessPoints(1, 0, 3, 0)).toBe(10);
  });

  it("retorna 18 para empate com saldo igual (1×1 vs 2×2 — saldo 0 em ambos)", () => {
    // Qualquer empate vs empate tem saldo=0 → sempre 18, nunca 10
    expect(calculateGuessPoints(1, 1, 2, 2)).toBe(18);
  });

  it("retorna 10 para vencedor correto (A) com saldo diferente", () => {
    // palpite 1×0 (A+1), resultado 2×0 (A+2) — correto o vencedor, saldo diferente
    expect(calculateGuessPoints(1, 0, 2, 0)).toBe(10);
  });

  it("retorna 10 para vitória do B (placar diferente)", () => {
    expect(calculateGuessPoints(0, 2, 0, 1)).toBe(10);
  });

  // ── 5 pts: acertou gols de apenas um time ──────────────────────────────
  it("retorna 5 quando palpite 1×0 e resultado 0×0 (acertou zero do B)", () => {
    expect(calculateGuessPoints(1, 0, 0, 0)).toBe(5);
  });

  it("retorna 5 quando palpite 0×0 e resultado 1×0 (acertou zero do B)", () => {
    expect(calculateGuessPoints(0, 0, 1, 0)).toBe(5);
  });

  it("retorna 5 quando acerta o número de gols do time A", () => {
    // palpite 2×3, resultado 2×1 — acertou os 2 gols do A, mas errou vencedor
    expect(calculateGuessPoints(2, 3, 2, 1)).toBe(5);
  });

  it("retorna 5 quando acerta o número de gols do time B", () => {
    // palpite 3×1, resultado 0×1 — acertou o 1 do B, mas errou o vencedor
    expect(calculateGuessPoints(3, 1, 0, 1)).toBe(5);
  });

  // ── 0 pts: erro total ───────────────────────────────────────────────────
  it("retorna 0 para erro total", () => {
    expect(calculateGuessPoints(1, 0, 0, 2)).toBe(0);
  });

  it("retorna 0 quando errou vencedor e os dois placares", () => {
    expect(calculateGuessPoints(2, 0, 0, 1)).toBe(0);
  });
});
