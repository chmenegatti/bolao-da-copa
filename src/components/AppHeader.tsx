"use client";

import { useEffect, useRef, useState } from "react";
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
  ChevronDown,
  User,
  Banknote,
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jogos", label: "Jogos", icon: Target },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/special-bets", label: "Apostas", icon: Crown },
  ];

  const userMenuLinks = [
    { href: "/my-bets", label: "Meus Palpites", icon: ListChecks },
    { href: "/help", label: "Como Funciona", icon: HelpCircle },
    ...(isAdmin
      ? [
        { href: "/admin", label: "Admin", icon: Shield },
        { href: "/admin/finance", label: "Finanças", icon: Banknote },
      ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.65)] backdrop-blur supports-backdrop-filter:bg-emerald-950/90">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
              <Star className="h-5 w-5 text-gold" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="font-display text-lg font-bold tracking-tight block">
                Palpite Perfeito
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 rounded-full bg-white/6 p-1.5 ring-1 ring-white/10">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={`flex min-w-fit items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors ${active
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden xl:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 ring-1 ring-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <Trophy className="h-4 w-4 text-gold" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold truncate max-w-30">{userName}</p>
                <p className="text-xs text-white/70">{totalPoints} pts</p>
              </div>
            </div>

            <div ref={userMenuRef} className="relative">
              <Button
                variant="ghost"
                className="h-10 rounded-full border border-white/10 bg-white/5 px-4 text-white hover:bg-white/10"
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <User className="h-4 w-4 mr-2" />
                Menu
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-emerald-950/95 p-2 shadow-2xl backdrop-blur">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-white">{userName}</p>
                    <p className="text-xs text-white/60">{totalPoints} pontos</p>
                  </div>
                  <Separator className="my-2 bg-white/10" />
                  {userMenuLinks.map((link) => {
                    const Icon = link.icon;
                    const active = pathname === link.href;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setUserMenuOpen(false)}
                        className={`mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors first:mt-0 ${active
                          ? "bg-white/10 text-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth" })}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>
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
            <div className="mb-3 rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/10">
              <p className="text-sm font-semibold">{userName}</p>
              <div className="mt-1 flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-gold" />
                <span className="text-xs font-semibold text-gold">{totalPoints} pts</span>
              </div>
            </div>
            <Separator className="mb-2 bg-white/10" />
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
            <Separator className="my-2 bg-white/10" />
            {userMenuLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active
                    ? "bg-white/15 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ callbackUrl: "/auth" })}
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
