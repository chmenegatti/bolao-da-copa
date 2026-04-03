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

  // ── 20 pts: vencedor + gols de um time ─────────────────────────────────
  it("retorna 20 para vencedor correto com um placar exato de time", () => {
    expect(calculateGuessPoints(3, 0, 3, 1)).toBe(20);
  });

  it("retorna 20 para vitória do B com um placar exato de time", () => {
    expect(calculateGuessPoints(2, 1, 3, 1)).toBe(20);
  });

  // ── 18 pts: empate não exato ───────────────────────────────────────────
  it("retorna 18 para empate sem placar exato", () => {
    expect(calculateGuessPoints(1, 1, 2, 2)).toBe(18);
  });

  it("retorna 0 para empate com apenas um placar exato", () => {
    expect(calculateGuessPoints(2, 1, 2, 2)).toBe(0);
  });

  // ── 15 pts: vencedor seco ──────────────────────────────────────────────
  it("retorna 15 para vencedor correto sem acertar nenhum placar", () => {
    expect(calculateGuessPoints(1, 0, 3, 1)).toBe(15);
  });

  it("retorna 15 para vitória do B sem acertar nenhum placar", () => {
    expect(calculateGuessPoints(4, 2, 3, 1)).toBe(15);
  });

  // ── 5 pts: gols isolados ───────────────────────────────────────────────
  it("retorna 5 quando erra o vencedor, mas acerta os gols do perdedor", () => {
    expect(calculateGuessPoints(0, 1, 3, 1)).toBe(5);
  });

  it("retorna 0 quando erra o vencedor e não acerta os gols do perdedor", () => {
    expect(calculateGuessPoints(1, 3, 3, 1)).toBe(0);
  });

  // ── 0 pts: erro total ───────────────────────────────────────────────────
  it("retorna 0 para erro total", () => {
    expect(calculateGuessPoints(0, 2, 3, 1)).toBe(0);
  });

  it("retorna 0 quando errou vencedor e os dois placares", () => {
    expect(calculateGuessPoints(1, 3, 3, 1)).toBe(0);
  });
});
