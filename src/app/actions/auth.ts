"use server";

import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Informe um email válido." };
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Este email já está cadastrado." };
    }

    const hashedPassword = await hash(password, 12);
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Este email já está cadastrado." };
    }
    throw error;
  }

  return { success: true };
}

export async function login(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password || !EMAIL_REGEX.test(email)) {
    return { error: "Email ou senha incorretos." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha incorretos." };
    }
    throw error;
  }
}
