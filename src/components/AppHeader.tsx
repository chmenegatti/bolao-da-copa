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
    { href: "/", label: "Jogos", icon: Target },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/special-bets", label: "Apostas Especiais", icon: Crown },
    { href: "/my-bets", label: "Meus Palpites", icon: ListChecks },
    { href: "/help", label: "Como Funciona", icon: HelpCircle },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 gradient-hero text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Star className="h-5 w-5 text-gold" />
            <span className="font-display text-lg font-bold tracking-tight hidden sm:block">
              Palpite Perfeito
            </span>
          </Link>

          {/* Desktop Nav — ícone+label em xl, só ícone em md */}
          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${active
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
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="text-right leading-none">
              <p className="text-sm font-medium truncate max-w-30">{userName}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Trophy className="h-3 w-3 text-gold" />
                <span className="text-xs text-gold font-semibold">{totalPoints} pts</span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-7 bg-white/20" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/auth" })}
              title="Sair"
              className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
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
