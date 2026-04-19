import { useLiveQuery } from "dexie-react-hooks";
import { db, type Completion } from "../db";
import { toDateStr } from "../lib/utils";

export function useCompletionsForHabit(habitId: string) {
  return (
    useLiveQuery(
      () => db.completions.where("habitId").equals(habitId).toArray(),
      [habitId],
    ) ?? []
  );
}

export async function setCompletion(
  habitId: string,
  status: Completion["status"],
  date: string = toDateStr(),
) {
  const existing = await db.completions
    .where("[habitId+date]")
    .equals([habitId, date])
    .first();

  if (existing) {
    if (existing.status === status) {
      await db.completions.delete(existing.id);
    } else {
      await db.completions.update(existing.id, { status });
    }
  } else {
    await db.completions.add({
      id: crypto.randomUUID(),
      habitId,
      date,
      status,
      createdAt: Date.now(),
    });
  }
}
