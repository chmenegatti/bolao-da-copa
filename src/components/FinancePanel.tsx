"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Banknote, CircleCheckBig, Clock3, RotateCcw, Shield } from "lucide-react";
import { setUserPaymentStatus } from "@/app/actions/admin";
import { toast } from "sonner";

interface FinanceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  totalPoints: number;
  paymentConfirmed: boolean;
  paymentConfirmedAt: string | null;
  createdAt: string;
}

interface FinancePanelProps {
  users: FinanceUser[];
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function FinancePanel({ users }: FinancePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const router = useRouter();

  const paidUsers = users.filter((user) => user.paymentConfirmed).length;
  const pendingUsers = users.length - paidUsers;

  const handleTogglePayment = (user: FinanceUser) => {
    setUpdatingUserId(user.id);
    startTransition(async () => {
      const result = await setUserPaymentStatus(user.id, !user.paymentConfirmed);
      setUpdatingUserId(null);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        user.paymentConfirmed ? "Pagamento marcado como pendente." : "Pagamento confirmado."
      );
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuários pagos</CardDescription>
            <CardTitle className="text-3xl font-display">{paidUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagamentos pendentes</CardDescription>
            <CardTitle className="text-3xl font-display">{pendingUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de usuários</CardDescription>
            <CardTitle className="text-3xl font-display">{users.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Banknote className="h-5 w-5 text-primary" />
            Gestão Financeira
          </CardTitle>
          <CardDescription>
            Confirme aqui quem já pagou. Usuários sem pagamento confirmado ficam bloqueados para palpites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confirmado em</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isBusy = isPending && updatingUserId === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {user.role === "ADMIN" && (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.paymentConfirmed ? "default" : "secondary"}
                        className={user.paymentConfirmed ? "bg-emerald-600 text-white" : ""}
                      >
                        {user.paymentConfirmed ? (
                          <CircleCheckBig className="h-3 w-3" />
                        ) : (
                          <Clock3 className="h-3 w-3" />
                        )}
                        {user.paymentConfirmed ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(user.paymentConfirmedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={user.paymentConfirmed ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleTogglePayment(user)}
                        disabled={isBusy}
                      >
                        {isBusy ? (
                          <RotateCcw className="h-4 w-4 animate-spin" />
                        ) : user.paymentConfirmed ? (
                          "Marcar pendente"
                        ) : (
                          "Confirmar pagamento"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}