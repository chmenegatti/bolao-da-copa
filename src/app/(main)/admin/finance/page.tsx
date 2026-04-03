import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import FinancePanel from "@/components/FinancePanel";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      totalPoints: true,
      paymentConfirmed: true,
      paymentConfirmedAt: true,
      createdAt: true,
    },
  });

  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    paymentConfirmedAt: user.paymentConfirmedAt ? user.paymentConfirmedAt.toISOString() : null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Gestão Financeira</h1>
        <p className="text-muted-foreground mt-1">
          Confirme pagamentos e libere os palpites dos participantes
        </p>
      </div>

      <FinancePanel users={serializedUsers} />
    </div>
  );
}