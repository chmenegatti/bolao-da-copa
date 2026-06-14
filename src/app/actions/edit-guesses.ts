"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import { calculateGuessPoints } from "@/lib/game-logic";
import { recalculateUsersTotalPoints } from "@/lib/points-recalculation";
import { SUPER_EDITOR_USER_ID } from "@/lib/super-editor";
import { revalidatePath } from "next/cache";

const MAX_SCORE = 30;

/**
 * Edição livre de palpite, exclusiva do usuário SUPER_EDITOR_USER_ID.
 *
 * Diferente de saveGuess(), NÃO respeita o prazo de aposta nem o status da
 * partida: permite alterar qualquer palpite a qualquer momento. Se a partida
 * já estiver FINISHED, recalcula os pontos do palpite e o totalPoints do
 * usuário dentro de uma transação.
 */
export async function superEditGuess(
  matchId: string,
  guessA: number,
  guessB: number
) {
  const user = await getRequiredUser();

  if (user.id !== SUPER_EDITOR_USER_ID) {
    return { error: "Acesso não autorizado." };
  }

  if (
    guessA < 0 ||
    guessB < 0 ||
    guessA > MAX_SCORE ||
    guessB > MAX_SCORE ||
    !Number.isInteger(guessA) ||
    !Number.isInteger(guessB)
  ) {
    return { error: `Placares devem ser números inteiros entre 0 e ${MAX_SCORE}.` };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return { error: "Partida não encontrada." };
  }

  const pointsEarned =
    match.status === "FINISHED" && match.scoreA !== null && match.scoreB !== null
      ? calculateGuessPoints(guessA, guessB, match.scoreA, match.scoreB)
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.guess.upsert({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId,
        },
      },
      update: { guessA, guessB, pointsEarned },
      create: { userId: user.id, matchId, guessA, guessB, pointsEarned },
    });

    if (match.status === "FINISHED") {
      await recalculateUsersTotalPoints(tx, [user.id]);
    }
  });

  revalidatePath("/");
  revalidatePath("/ranking");
  revalidatePath("/my-bets");
  revalidatePath("/editar-palpites");
  return { success: true };
}
