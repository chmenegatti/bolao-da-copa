import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getSession() {
  return await auth();
}

export async function getRequiredUser({ skipMustChangePasswordCheck = false } = {}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      paymentConfirmed: true,
      paymentConfirmedAt: true,
      mustChangePassword: true,
    },
  });

  if (!user) {
    redirect("/auth");
  }

  if (!skipMustChangePasswordCheck && user.mustChangePassword) {
    redirect("/change-password");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getRequiredUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
