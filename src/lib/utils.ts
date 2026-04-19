import { format, subDays, differenceInCalendarDays, parseISO } from "date-fns";

export function toDateStr(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDisplayDate(date: Date = new Date()): string {
  return format(date, "EEEE, MMMM d");
}

export function calcStreak(
  doneSet: Set<string>,
  today: string = toDateStr(),
): { current: number; longest: number } {
  if (doneSet.size === 0) return { current: 0, longest: 0 };

  let current = 0;
  const todayDate = parseISO(today);

  // Walk back from today
  for (let i = 0; i <= 365; i++) {
    const d = toDateStr(subDays(todayDate, i));
    if (doneSet.has(d)) {
      current++;
    } else if (i === 0) {
      // today not done yet — check yesterday for an ongoing streak
      continue;
    } else {
      break;
    }
  }

  // Longest streak — scan all sorted dates
  const sorted = [...doneSet].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    if (
      prev === null ||
      differenceInCalendarDays(parseISO(d), parseISO(prev)) === 1
    ) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  return { current, longest };
}

export function buildHeatmapGrid(
  completions: { date: string; status: "done" | "skipped" }[],
  weeksBack = 52,
): { date: string; status: "done" | "skipped" | null }[][] {
  const today = new Date();
  const statusMap = new Map(completions.map((c) => [c.date, c.status]));
  const totalDays = weeksBack * 7 + today.getDay();

  const allDays: { date: string; status: "done" | "skipped" | null }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = toDateStr(subDays(today, totalDays - 1 - i));
    allDays.push({ date: d, status: statusMap.get(d) ?? null });
  }

  const weeks: (typeof allDays)[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}
