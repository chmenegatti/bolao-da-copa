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
 *  18 pts — Vencedor/empate + saldo iguais (ex: 3×1 → 2×0 — ambos vitória com +2)
 *  10 pts — Apenas vencedor ou empate      (ex: 1×0 → 3×0)
 *   5 pts — Acertou gols de um time         (ex: 1×0 → 0×0, acertou o zero)
 *   0 pts — Erro total
 */
export function calculateGuessPoints(
  guessA: number,
  guessB: number,
  realA: number,
  realB: number
): number {
  // Placar exato
  if (guessA === realA && guessB === realB) return 25;

  const guessDiff = guessA - guessB;
  const realDiff = realA - realB;

  const winner = (a: number, b: number) =>
    a > b ? "a" : a < b ? "b" : "draw";

  const guessWinner = winner(guessA, guessB);
  const realWinner = winner(realA, realB);

  // Vencedor correto + mesmo saldo de gols
  if (guessWinner === realWinner && guessDiff === realDiff) return 18;

  // Apenas o vencedor (ou empate)
  if (guessWinner === realWinner) return 10;

  // Acertou o número de gols de pelo menos um dos times (inclui zero)
  if (guessA === realA || guessB === realB) return 5;

  return 0;
}
