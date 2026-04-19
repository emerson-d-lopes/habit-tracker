import { db } from "../db";
import { subDays } from "date-fns";
import { toDateStr } from "./utils";

export async function seedSampleData() {
  await db.transaction("rw", db.habits, db.completions, async () => {
    await db.habits.clear();
    await db.completions.clear();

    const habits = [
      {
        id: crypto.randomUUID(),
        name: "meditate",
        createdAt: Date.now(),
        order: 0,
      },
      {
        id: crypto.randomUUID(),
        name: "read 30 min",
        createdAt: Date.now(),
        order: 1,
      },
      {
        id: crypto.randomUUID(),
        name: "exercise",
        createdAt: Date.now(),
        order: 2,
      },
      {
        id: crypto.randomUUID(),
        name: "journaling",
        createdAt: Date.now(),
        order: 3,
      },
    ];

    await db.habits.bulkAdd(habits);

    const [meditate, read, exercise, journal] = habits;
    const completions = [];

    for (let i = 90; i >= 1; i--) {
      const date = toDateStr(subDays(new Date(), i));
      const dow = new Date(date).getDay(); // 0=Sun, 6=Sat

      // meditate: strong streak, missed ~5 random days in the last 90
      const meditateMiss = [67, 45, 22, 11, 3].includes(i);
      if (!meditateMiss) {
        completions.push({
          id: crypto.randomUUID(),
          habitId: meditate.id,
          date,
          status: "done" as const,
          createdAt: Date.now(),
        });
      }

      // read: most days done, some skipped on weekends, a few gaps
      const readGap = [80, 79, 52, 51, 30, 15, 14].includes(i);
      const readSkip =
        !readGap && (dow === 0 || dow === 6) && Math.random() < 0.4;
      if (!readGap) {
        completions.push({
          id: crypto.randomUUID(),
          habitId: read.id,
          date,
          status: readSkip ? ("skipped" as const) : ("done" as const),
          createdAt: Date.now(),
        });
      }

      // exercise: Mon/Wed/Fri/Sat pattern, occasional skip
      const exerciseDay = [1, 3, 5, 6].includes(dow);
      if (exerciseDay && i > 5) {
        const skip = [60, 45, 32, 18].includes(i);
        completions.push({
          id: crypto.randomUUID(),
          habitId: exercise.id,
          date,
          status: skip ? ("skipped" as const) : ("done" as const),
          createdAt: Date.now(),
        });
      }

      // journaling: started ~30 days ago, sporadic
      if (i <= 30) {
        const journalDone = [
          30, 29, 27, 25, 24, 20, 18, 17, 15, 12, 10, 9, 7, 6, 5, 4, 3, 2, 1,
        ].includes(i);
        if (journalDone) {
          completions.push({
            id: crypto.randomUUID(),
            habitId: journal.id,
            date,
            status: "done" as const,
            createdAt: Date.now(),
          });
        }
      }
    }

    await db.completions.bulkAdd(completions);
  });
}
