"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Trophy,
  LogOut,
  Menu,
  X,
  Shield,
  Star,
  Target,
  LayoutDashboard,
  ListChecks,
  Crown,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  userName: string;
  totalPoints: number;
  isAdmin: boolean;
}

export default function AppHeader({
  userName,
  totalPoints,
  isAdmin,
}: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jogos", label: "Jogos", icon: Target },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/special-bets", label: "Apostas Especiais", icon: Crown },
    { href: "/my-bets", label: "Meus Palpites", icon: ListChecks },
    { href: "/help", label: "Como Funciona", icon: HelpCircle },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.65)] backdrop-blur supports-backdrop-filter:bg-emerald-950/90">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between gap-3 h-16">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
              <Star className="h-5 w-5 text-gold" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="font-display text-lg font-bold tracking-tight block">
                Palpite Perfeito
              </span>
            </div>
          </Link>

          {/* Desktop Nav — ícone+label em xl, só ícone em md */}
          <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-white/8 p-1 ring-1 ring-white/10">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${active
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden xl:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info + logout */}
          <div className="hidden md:flex items-center gap-2 shrink-0 rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10">
            <div className="text-right leading-none">
              <p className="text-sm font-medium truncate max-w-30">{userName}</p>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                {isAdmin && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/70">
                    Admin
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-gold" />
                  <span className="text-xs text-gold font-semibold">{totalPoints} pts</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/auth" })}
              title="Sair"
              className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 rounded-full"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div>
                <p className="text-sm font-medium">{userName}</p>
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-gold" />
                  <span className="text-xs text-gold font-semibold">{totalPoints} pts</span>
                </div>
              </div>
            </div>
            <Separator className="bg-white/20 mb-2" />
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <Separator className="bg-white/20 my-2" />
            <button
              onClick={() => signOut({ callbackUrl: "/auth" })}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
