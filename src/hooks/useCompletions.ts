import { useLiveQuery } from "dexie-react-hooks";
import { db, type Completion } from "../db";
import { toDateStr } from "../lib/utils";
import { recordCompletion, recordCompletionDeleted } from "../sync";

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
      await recordCompletionDeleted(existing.id);
    } else {
      await db.completions.update(existing.id, { status });
      await recordCompletion({ ...existing, status });
    }
  } else {
    const completion = {
      id: crypto.randomUUID(),
      habitId,
      date,
      status,
      createdAt: Date.now(),
    };
    await db.completions.add(completion);
    await recordCompletion(completion);
  }
}
