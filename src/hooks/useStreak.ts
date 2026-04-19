import { useMemo } from "react";
import { type Completion } from "../db";
import { calcStreak } from "../lib/utils";

export function useStreak(completions: Completion[]) {
  return useMemo(() => {
    const doneSet = new Set(
      completions.filter((c) => c.status === "done").map((c) => c.date),
    );
    return calcStreak(doneSet);
  }, [completions]);
}
