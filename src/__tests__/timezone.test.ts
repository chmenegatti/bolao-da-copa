import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isBettingOpen } from "@/lib/timezone";
import { canUserPlaceGuess } from "@/lib/game-logic";

/**
 * Helpers para criar datas relativas ao "agora" mockado.
 * isBettingOpen usa `new Date()` internamente, então precisamos de fake timers.
 */
function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

describe("isBettingOpen — janela de 10 minutos", () => {
  beforeEach(() => {
    // Congela o relógio em um momento fixo (horário de Brasília)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T20:00:00-03:00")); // 20h BRT = 23h UTC
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite apostas 11 minutos antes do jogo", () => {
    expect(isBettingOpen(minutesFromNow(11))).toBe(true);
  });

  it("permite apostas exatamente no limite (10 min + 1 seg antes)", () => {
    const matchTime = new Date(Date.now() + 10 * 60 * 1000 + 1000); // 10:01
    expect(isBettingOpen(matchTime)).toBe(true);
  });

  it("bloqueia apostas exatamente 10 minutos antes", () => {
    expect(isBettingOpen(minutesFromNow(10))).toBe(false);
  });

  it("bloqueia apostas 9 minutos antes", () => {
    expect(isBettingOpen(minutesFromNow(9))).toBe(false);
  });

  it("bloqueia apostas 5 minutos antes", () => {
    expect(isBettingOpen(minutesFromNow(5))).toBe(false);
  });

  it("bloqueia apostas 1 minuto antes", () => {
    expect(isBettingOpen(minutesFromNow(1))).toBe(false);
  });

  it("bloqueia apostas quando o jogo já começou (agora)", () => {
    expect(isBettingOpen(minutesFromNow(0))).toBe(false);
  });

  it("bloqueia apostas para jogo já encerrado (no passado)", () => {
    expect(isBettingOpen(minutesFromNow(-90))).toBe(false);
  });

  it("permite apostas com muita antecedência (1 dia antes)", () => {
    expect(isBettingOpen(minutesFromNow(24 * 60))).toBe(true);
  });
});

describe("canUserPlaceGuess — delega para isBettingOpen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T20:00:00-03:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna true quando apostas estão abertas (11 min antes)", () => {
    expect(canUserPlaceGuess(minutesFromNow(11))).toBe(true);
  });

  it("retorna false quando dentro da janela bloqueada (9 min antes)", () => {
    expect(canUserPlaceGuess(minutesFromNow(9))).toBe(false);
  });
});
