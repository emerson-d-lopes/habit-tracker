import { useLiveQuery } from "dexie-react-hooks";
import { db, type Completion } from "../db";
import { HabitRow } from "../components/HabitRow";
import { formatDisplayDate, toDateStr } from "../lib/utils";
import { useActiveHabits } from "../hooks/useHabits";
import { Link } from "react-router";

export function Today() {
  const today = toDateStr();
  const habits = useActiveHabits();

  const completions: Completion[] =
    useLiveQuery(
      () => db.completions.where("date").equals(today).toArray(),
      [today],
    ) ?? [];

  const completionMap = new Map(completions.map((c) => [c.habitId, c]));
  const doneCount = completions.filter((c) => c.status === "done").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-accent">
          {formatDisplayDate()}
        </h1>
        {habits.length > 0 && (
          <p className="text-sm text-text-secondary mt-1">
            {doneCount} / {habits.length} done
          </p>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-text-muted text-sm">no habits yet.</p>
          <Link to="/habits" className="btn btn-secondary mt-4 inline-block">
            add your first habit
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              completion={completionMap.get(habit.id)}
            />
          ))}
        </div>
      )}

      {habits.length > 0 && doneCount === habits.length && (
        <p className="text-sm text-success text-center">all done for today.</p>
      )}
    </div>
  );
}
