import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Sao_Paulo";
const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Verifica se as apostas ainda estão abertas para uma partida.
 * Compara o horário atual em America/Sao_Paulo com o horário da partida.
 * Apostas fecham 10 minutos antes do início.
 */
export function isBettingOpen(matchDatetime: Date): boolean {
  const now = toZonedTime(new Date(), TIMEZONE);
  const matchTime = toZonedTime(new Date(matchDatetime), TIMEZONE);
  return now.getTime() < matchTime.getTime() - TEN_MINUTES_MS;
}

/**
 * Formata a data da partida no fuso de São Paulo, em pt-BR.
 */
export function formatMatchDate(date: Date, fmt: string = "dd MMM"): string {
  const zonedDate = toZonedTime(new Date(date), TIMEZONE);
  return format(zonedDate, fmt, { locale: ptBR });
}

/**
 * Formata o horário da partida no fuso de São Paulo.
 */
export function formatMatchTime(date: Date): string {
  const zonedDate = toZonedTime(new Date(date), TIMEZONE);
  return format(zonedDate, "HH:mm", { locale: ptBR });
}
