import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { recordHabit, recordHabitDeleted } from "../sync";

export function useHabits() {
  return useLiveQuery(() => db.habits.orderBy("order").toArray(), []) ?? [];
}

export function useActiveHabits() {
  return (
    useLiveQuery(
      () =>
        db.habits
          .orderBy("order")
          .filter((h) => !h.archivedAt)
          .toArray(),
      [],
    ) ?? []
  );
}

export async function createHabit(name: string) {
  const all = await db.habits.toArray();
  const maxOrder = all.reduce((m, h) => Math.max(m, h.order), -1);
  const habit = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: Date.now(),
    order: maxOrder + 1,
  };
  await db.habits.add(habit);
  await recordHabit(habit);
}

export async function updateHabit(id: string, name: string) {
  await db.habits.update(id, { name: name.trim() });
  await recordCurrent(id);
}

export async function archiveHabit(id: string) {
  await db.habits.update(id, { archivedAt: Date.now() });
  await recordCurrent(id);
}

export async function unarchiveHabit(id: string) {
  await db.habits.update(id, { archivedAt: undefined });
  await recordCurrent(id);
}

export async function deleteHabit(id: string) {
  await db.transaction("rw", db.habits, db.completions, async () => {
    await db.habits.delete(id);
    await db.completions.where("habitId").equals(id).delete();
  });
  await recordHabitDeleted(id);
}

async function recordCurrent(id: string) {
  const habit = await db.habits.get(id);
  if (habit) await recordHabit(habit);
}
