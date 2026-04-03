"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarProps {
  className?: string;
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
}

function capitalizeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Calendar({ className, selected, onSelect }: CalendarProps) {
  const [visibleMonth, setVisibleMonth] = React.useState(() => startOfMonth(selected ?? new Date()));

  React.useEffect(() => {
    if (selected) {
      setVisibleMonth(startOfMonth(selected));
    }
  }, [selected]);

  const days = React.useMemo(() => {
    const monthStart = startOfWeek(startOfMonth(visibleMonth), { locale: ptBR });
    const monthEnd = endOfWeek(endOfMonth(visibleMonth), { locale: ptBR });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [visibleMonth]);

  const weekdayLabels = React.useMemo(() => {
    const weekStart = startOfWeek(new Date(), { locale: ptBR });
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }).map((day) =>
      capitalizeLabel(format(day, "EEE", { locale: ptBR }).replace(".", ""))
    );
  }, []);

  const monthLabel = capitalizeLabel(format(visibleMonth, "MMMM yyyy", { locale: ptBR }));

  return (
    <div className={cn("w-full rounded-xl border bg-background p-3", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
          <p className="text-xs text-muted-foreground">Escolha um dia para filtrar os jogos.</p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setVisibleMonth((current) => subMonths(current, 1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[0.72rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isOutsideMonth = !isSameMonth(day, visibleMonth);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isCurrentDay = isToday(day);

          return (
            <Button
              key={day.toISOString()}
              type="button"
              variant={isSelected ? "default" : "ghost"}
              size="icon-sm"
              className={cn(
                "h-9 w-9 rounded-full p-0 font-normal",
                isOutsideMonth && "text-muted-foreground/60",
                isCurrentDay && !isSelected && "ring-1 ring-primary/40",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => {
                onSelect?.(day);
                setVisibleMonth(startOfMonth(day));
              }}
              aria-label={format(day, "PPP", { locale: ptBR })}
              aria-pressed={isSelected}
            >
              {format(day, "d")}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };