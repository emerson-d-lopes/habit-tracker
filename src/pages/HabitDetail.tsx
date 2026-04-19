import { useParams, Link, useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Completion } from "../db";
import { HeatMap } from "../components/HeatMap";
import { StreakBadge } from "../components/StreakBadge";
import { useStreak } from "../hooks/useStreak";
import { useCompletionsForHabit } from "../hooks/useCompletions";

export function HabitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const habit = useLiveQuery(() => (id ? db.habits.get(id) : undefined), [id]);
  const completions = useCompletionsForHabit(id ?? "");
  const streak = useStreak(completions);

  if (habit === undefined) {
    return <p className="text-text-muted text-sm">loading...</p>;
  }

  if (habit === null) {
    return (
      <div className="space-y-4">
        <p className="text-text-muted text-sm">habit not found.</p>
        <Link to="/habits" className="btn btn-secondary text-sm">
          back to habits
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost text-sm px-2"
          aria-label="go back"
        >
          ←
        </button>
        <h1 className="text-2xl font-medium text-accent">{habit.name}</h1>
      </div>

      <StreakBadge current={streak.current} longest={streak.longest} />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary">
          activity — last 52 weeks
        </h2>
        <HeatMap completions={completions} />
      </div>

      <div className="text-xs text-text-faint">
        {completions.filter((c: Completion) => c.status === "done").length} days
        completed total
      </div>
    </div>
  );
}
