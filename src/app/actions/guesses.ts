"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-helpers";
import { canUserPlaceGuess } from "@/lib/game-logic";
import { PAYMENT_PENDING_MESSAGE } from "@/lib/payment";
import { revalidatePath } from "next/cache";

const MAX_SCORE = 30;

export async function saveGuess(matchId: string, guessA: number, guessB: number) {
  const user = await getRequiredUser();

  if (!user.paymentConfirmed) {
    return { error: PAYMENT_PENDING_MESSAGE };
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

  if (match.status === "FINISHED") {
    return { error: "Esta partida já foi finalizada." };
  }

  if (!canUserPlaceGuess(match.datetime)) {
    return { error: "Prazo encerrado. Apostas fecham 10 minutos antes do início do jogo." };
  }

  try {
    await prisma.guess.upsert({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId,
        },
      },
      update: {
        guessA,
        guessB,
      },
      create: {
        userId: user.id,
        matchId,
        guessA,
        guessB,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return { error: "Partida não encontrada ou indisponível no momento." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/my-bets");
  return { success: true };
}
