import { prisma } from "@/lib/prisma";
import { Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const users: { id: string; name: string; totalPoints: number }[] = await prisma.user.findMany({
    where: { name: { not: "Administrador" } },
    orderBy: { totalPoints: "desc" },
    select: {
      id: true,
      name: true,
      totalPoints: true,
    },
  });

  const top3 = users.slice(0, 3);

  const podiumStyles = [
    "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
    "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
    "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
  ];

  const podiumLabels = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-gold" />
          Ranking
        </h1>
        <p className="text-muted-foreground mt-1">
          Classificação geral por pontos
        </p>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* 2nd place (left) */}
          {top3[1] ? (
            <div className="flex flex-col items-center justify-end">
              <Card
                className={`w-full p-4 text-center ${podiumStyles[1]} animate-slide-up`}
                style={{ animationDelay: "0.1s" }}
              >
                <span className="text-2xl">{podiumLabels[1]}</span>
                <p className="font-display font-bold text-sm mt-1 truncate">
                  {top3[1].name}
                </p>
                <p className="text-xl font-bold mt-1">
                  {top3[1].totalPoints}
                </p>
                <p className="text-xs opacity-80">pontos</p>
              </Card>
            </div>
          ) : (
            <div />
          )}

          {/* 1st place (center, taller) */}
          {top3[0] && (
            <div className="flex flex-col items-center justify-end">
              <Card
                className={`w-full p-5 text-center ${podiumStyles[0]} animate-pulse-gold`}
              >
                <span className="text-3xl">{podiumLabels[0]}</span>
                <p className="font-display font-bold mt-1 truncate">
                  {top3[0].name}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {top3[0].totalPoints}
                </p>
                <p className="text-xs opacity-80">pontos</p>
              </Card>
            </div>
          )}

          {/* 3rd place (right) */}
          {top3[2] ? (
            <div className="flex flex-col items-center justify-end">
              <Card
                className={`w-full p-4 text-center ${podiumStyles[2]} animate-slide-up`}
                style={{ animationDelay: "0.2s" }}
              >
                <span className="text-2xl">{podiumLabels[2]}</span>
                <p className="font-display font-bold text-sm mt-1 truncate">
                  {top3[2].name}
                </p>
                <p className="text-xl font-bold mt-1">
                  {top3[2].totalPoints}
                </p>
                <p className="text-xs opacity-80">pontos</p>
              </Card>
            </div>
          ) : (
            <div />
          )}
        </div>
      )}

      <Separator className="my-4" />

      {/* Full ranking list */}
      <div className="space-y-2">
        {users.map((user, index) => (
          <Card
            key={user.id}
            className={`flex items-center justify-between px-4 py-3 animate-fade-in ${index < 3 ? "border-gold/30" : ""
              }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0
                  ? "bg-yellow-400 text-yellow-900"
                  : index === 1
                    ? "bg-gray-300 text-gray-700"
                    : index === 2
                      ? "bg-amber-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
              </div>
            </div>
            <Badge
              variant={index < 3 ? "default" : "secondary"}
              className={
                index === 0
                  ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                  : ""
              }
            >
              <Medal className="h-3 w-3 mr-1" />
              {user.totalPoints} pts
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
