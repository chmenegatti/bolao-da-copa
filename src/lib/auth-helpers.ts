import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return await auth();
}

export async function getRequiredUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await getRequiredUser();
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
