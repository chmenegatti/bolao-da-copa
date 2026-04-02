import { isBettingOpen } from "@/lib/timezone";

/**
 * Verifica se o usuário ainda pode registrar ou alterar um palpite.
 *
 * As datas armazenadas no banco (SQLite) são sempre UTC. A comparação é feita
 * convertendo ambas para o fuso America/Sao_Paulo antes de calcular a diferença,
 * evitando erros causados pela configuração de timezone do servidor local.
 *
 * Retorna `false` se faltarem menos de 10 minutos para o início do jogo,
 * ou se o jogo já tiver começado/encerrado.
 */
export function canUserPlaceGuess(matchDate: Date): boolean {
  return isBettingOpen(matchDate);
}

/**
 * Calcula os pontos obtidos por um palpite de partida.
 *
 * Regras:
 *  25 pts — Placar exato                   (ex: 2×1 → 2×1)
 *  18 pts — Vencedor + gols de um time     (ex: 3×1 → 3×0 ou 2×1)
 *  15 pts — Vencedor seco                  (ex: 3×1 → 1×0 ou 4×2)
 *  10 pts — Empate não exato               (ex: 2×2 → 1×1)
 *   5 pts — Gols isolados                  (ex: 3×1 → 3×4 ou 0×1)
 *   0 pts — Erro total
 */
export function calculateGuessPoints(
  guessA: number,
  guessB: number,
  realA: number,
  realB: number
): number {
  const winner = (a: number, b: number) =>
    a > b ? "a" : a < b ? "b" : "draw";

  const guessWinner = winner(guessA, guessB);
  const realWinner = winner(realA, realB);
  const hasExactTeamScore = guessA === realA || guessB === realB;

  // Placar exato
  if (guessA === realA && guessB === realB) return 25;

  if (guessWinner === realWinner) {
    if (guessWinner === "draw") return 10;
    if (hasExactTeamScore) return 18;
    return 15;
  }

  if (hasExactTeamScore) return 5;

  return 0;
}
