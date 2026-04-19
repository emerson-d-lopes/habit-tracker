import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  isSameDay,
  isToday,
  isFuture,
  getDay,
} from "date-fns";
import { db, type Completion } from "../db";
import { useActiveHabits } from "../hooks/useHabits";
import { setCompletion } from "../hooks/useCompletions";
import { toDateStr } from "../lib/utils";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function Log() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const habits = useActiveHabits();

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const completions: Completion[] =
    useLiveQuery(
      () =>
        db.completions
          .where("date")
          .between(toDateStr(monthStart), toDateStr(monthEnd), true, true)
          .toArray(),
      [toDateStr(monthStart)],
    ) ?? [];

  const completionMap = useMemo(() => {
    const map = new Map<string, Map<string, Completion>>();
    for (const c of completions) {
      if (!map.has(c.date)) map.set(c.date, new Map());
      map.get(c.date)!.set(c.habitId, c);
    }
    return map;
  }, [completions]);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart);

  const selectedDateStr = toDateStr(selectedDate);
  const selectedCompletions = completionMap.get(selectedDateStr) ?? new Map();
  const doneCount = [...selectedCompletions.values()].filter(
    (c) => c.status === "done",
  ).length;

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-accent">log</h1>
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost text-sm px-2"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            ←
          </button>
          <span className="text-sm text-text-secondary tabular-nums w-28 text-center">
            {format(month, "MMMM yyyy")}
          </span>
          <button
            className="btn btn-ghost text-sm px-2"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            disabled={
              isSameDay(addMonths(month, 1), addMonths(new Date(), 1)) ||
              addMonths(monthStart, 1) > new Date()
            }
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="card p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-text-faint"
              style={{ fontSize: "0.65rem" }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = toDateStr(day);
            const dayCompletions = completionMap.get(dateStr);
            const done = dayCompletions
              ? [...dayCompletions.values()].filter((c) => c.status === "done")
                  .length
              : 0;
            const total = habits.length;
            const isSelected = isSameDay(day, selectedDate);
            const future = isFuture(day) && !isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => !future && setSelectedDate(day)}
                disabled={future}
                className={[
                  "flex flex-col items-center justify-center rounded-md py-1 gap-0.5 transition-colors",
                  future
                    ? "opacity-25 cursor-not-allowed"
                    : "cursor-pointer hover:bg-surface-raised",
                  isSelected ? "bg-surface-raised ring-1 ring-border" : "",
                  isToday(day) ? "ring-1 ring-accent" : "",
                ].join(" ")}
              >
                <span
                  className={`text-xs tabular-nums ${isToday(day) ? "text-accent font-medium" : "text-text-secondary"}`}
                >
                  {format(day, "d")}
                </span>
                {total > 0 && !future && (
                  <div className="flex gap-px flex-wrap justify-center w-full px-1">
                    {done > 0 ? (
                      <span
                        className="text-success"
                        style={{ fontSize: "0.5rem" }}
                      >
                        {done}/{total}
                      </span>
                    ) : (
                      <span
                        className="text-text-faint"
                        style={{ fontSize: "0.5rem" }}
                      >
                        —
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day editor */}
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium text-text-secondary">
            {isToday(selectedDate)
              ? "today"
              : format(selectedDate, "EEEE, MMMM d")}
          </h2>
          {habits.length > 0 && (
            <span className="text-xs text-text-faint">
              {doneCount} / {habits.length} done
            </span>
          )}
        </div>

        {habits.length === 0 ? (
          <p className="text-sm text-text-muted">no habits yet.</p>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const completion = selectedCompletions.get(habit.id);
              const isDone = completion?.status === "done";
              const isSkipped = completion?.status === "skipped";

              return (
                <div
                  key={habit.id}
                  className={`card flex items-center justify-between gap-4 transition-opacity duration-200 ${isDone || isSkipped ? "opacity-50" : ""}`}
                >
                  <span className="flex-1 min-w-0 text-sm font-medium text-text truncate">
                    {habit.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setCompletion(habit.id, "done", selectedDateStr)
                      }
                      className={`btn btn-ghost text-xs px-3 py-1 ${isDone ? "text-success border border-success" : ""}`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() =>
                        setCompletion(habit.id, "skipped", selectedDateStr)
                      }
                      className={`btn btn-ghost text-xs px-3 py-1 ${isSkipped ? "text-text-muted border border-border" : ""}`}
                    >
                      —
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
