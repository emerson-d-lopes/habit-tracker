import Dexie, { type EntityTable } from "dexie";

export interface Habit {
  id: string;
  name: string;
  createdAt: number;
  archivedAt?: number;
  order: number;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: "done" | "skipped";
  createdAt: number;
}

class HabitDB extends Dexie {
  habits!: EntityTable<Habit, "id">;
  completions!: EntityTable<Completion, "id">;

  constructor() {
    super("habit-tracker");
    this.version(1).stores({
      habits: "id, createdAt, archivedAt, order",
      completions: "id, [habitId+date], date, habitId",
    });
  }
}

export const db = new HabitDB();
