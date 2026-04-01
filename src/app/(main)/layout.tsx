import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, totalPoints: true, role: true },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        userName={profile?.name ?? session.user.name}
        totalPoints={profile?.totalPoints ?? 0}
        isAdmin={profile?.role === "ADMIN"}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
