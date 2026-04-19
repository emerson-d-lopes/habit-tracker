import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router";
import { db, type Habit, type Completion } from "../db";
import { HeatMap } from "../components/HeatMap";
import { useStreak } from "../hooks/useStreak";
import { useActiveHabits } from "../hooks/useHabits";

function HabitSummaryCard({ habit }: { habit: Habit }) {
  const completions: Completion[] =
    useLiveQuery(
      () => db.completions.where("habitId").equals(habit.id).toArray(),
      [habit.id],
    ) ?? [];

  const streak = useStreak(completions);
  const totalDone = completions.filter((c) => c.status === "done").length;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          to={`/habits/${habit.id}`}
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
        >
          {habit.name}
        </Link>
        <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0">
          <span>
            <span
              className={`font-semibold tabular-nums ${streak.current > 0 ? "text-success" : "text-text-faint"}`}
            >
              {streak.current}
            </span>{" "}
            streak
          </span>
          <span>
            <span className="font-semibold tabular-nums text-text">
              {streak.longest}
            </span>{" "}
            best
          </span>
          <span>
            <span className="font-semibold tabular-nums text-text">
              {totalDone}
            </span>{" "}
            total
          </span>
        </div>
      </div>

      <HeatMap completions={completions} weeksBack={20} />
    </div>
  );
}

export function Overview() {
  const habits = useActiveHabits();

  if (habits.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-text-muted text-sm">no habits yet.</p>
        <Link to="/habits" className="btn btn-secondary mt-4 inline-block">
          add your first habit
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-accent">overview</h1>
      <div className="space-y-4">
        {habits.map((habit) => (
          <HabitSummaryCard key={habit.id} habit={habit} />
        ))}
      </div>
    </div>
  );
}
