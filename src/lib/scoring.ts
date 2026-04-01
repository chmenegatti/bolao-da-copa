export function calculatePoints(
  guessA: number,
  guessB: number,
  realA: number,
  realB: number
): number {
  // Placar exato
  if (guessA === realA && guessB === realB) return 25;

  const guessDiff = guessA - guessB;
  const realDiff = realA - realB;

  const guessWinner = guessA > guessB ? "a" : guessA < guessB ? "b" : "draw";
  const realWinner = realA > realB ? "a" : realA < realB ? "b" : "draw";

  // Acertou vencedor + saldo de gols
  if (guessWinner === realWinner && guessDiff === realDiff) return 18;

  // Acertou apenas o vencedor (ou empate)
  if (guessWinner === realWinner) return 10;

  // Erro total
  return 0;
}
