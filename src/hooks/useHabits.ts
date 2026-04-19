import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

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
  await db.habits.add({
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: Date.now(),
    order: maxOrder + 1,
  });
}

export async function updateHabit(id: string, name: string) {
  await db.habits.update(id, { name: name.trim() });
}

export async function archiveHabit(id: string) {
  await db.habits.update(id, { archivedAt: Date.now() });
}

export async function unarchiveHabit(id: string) {
  await db.habits.update(id, { archivedAt: undefined });
}

export async function deleteHabit(id: string) {
  await db.transaction("rw", db.habits, db.completions, async () => {
    await db.habits.delete(id);
    await db.completions.where("habitId").equals(id).delete();
  });
}
