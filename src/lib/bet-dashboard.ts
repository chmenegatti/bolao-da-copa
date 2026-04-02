import { isBettingOpen } from "@/lib/timezone";

export type BettingDeadlineTone = "green" | "yellow" | "red";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function formatRemainingTime(minutesLeft: number): string {
  const safeMinutes = Math.max(0, minutesLeft);

  if (safeMinutes >= 60) {
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return minutes > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${hours}h`;
  }

  return `${safeMinutes}m`;
}

export function getBettingDeadlineTone(minutesLeft: number): BettingDeadlineTone {
  if (minutesLeft > 180) return "green";
  if (minutesLeft > 60) return "yellow";
  return "red";
}

export function getBettingDeadlineClasses(tone: BettingDeadlineTone): string {
  switch (tone) {
    case "green":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "yellow":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "red":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
  }
}

export function getBettingDeadlineInfo(matchDate: Date, now = new Date()) {
  const closeAt = new Date(matchDate.getTime() - TEN_MINUTES_MS);
  const minutesLeft = Math.max(0, Math.ceil((closeAt.getTime() - now.getTime()) / 60000));
  const tone = getBettingDeadlineTone(minutesLeft);

  return {
    closeAt,
    minutesLeft,
    tone,
    isOpen: isBettingOpen(matchDate),
    countdown: formatRemainingTime(minutesLeft),
  };
}

export function getNextBettingClose<T extends { datetime: Date; status: string }>(
  matches: T[]
) {
  const upcomingMatches = matches
    .filter((match) => match.status !== "FINISHED" && isBettingOpen(match.datetime))
    .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  const nextMatch = upcomingMatches[0] ?? null;

  if (!nextMatch) {
    return null;
  }

  return {
    match: nextMatch,
    ...getBettingDeadlineInfo(nextMatch.datetime),
  };
}