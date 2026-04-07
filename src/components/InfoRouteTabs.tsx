"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Star } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/help", label: "Pontuação", icon: Star },
  { href: "/premiacao", label: "Premiação", icon: Coins },
];

export default function InfoRouteTabs() {
  const pathname = usePathname();

  return (
    <div className="inline-flex w-full rounded-2xl bg-emerald-950/90 p-1.5 text-white shadow-sm ring-1 ring-emerald-900/60 sm:w-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors sm:min-w-52",
              isActive
                ? "bg-emerald-600 text-white"
                : "text-white/65 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}