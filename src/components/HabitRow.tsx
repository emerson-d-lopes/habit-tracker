import { Link } from "react-router";
import { type Habit, type Completion } from "../db";
import { setCompletion } from "../hooks/useCompletions";

interface Props {
  habit: Habit;
  completion: Completion | undefined;
}

export function HabitRow({ habit, completion }: Props) {
  const isDone = completion?.status === "done";
  const isSkipped = completion?.status === "skipped";

  return (
    <div
      className={`card flex items-center justify-between gap-4 transition-opacity duration-200 ${
        isDone || isSkipped ? "opacity-50" : ""
      }`}
    >
      <Link
        to={`/habits/${habit.id}`}
        className="flex-1 min-w-0 text-sm font-medium text-text hover:text-accent transition-colors truncate"
      >
        {habit.name}
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setCompletion(habit.id, "done")}
          aria-label={isDone ? "unmark done" : "mark done"}
          title="done"
          className={`btn btn-ghost text-xs px-3 py-1 ${
            isDone ? "text-success border border-success" : ""
          }`}
        >
          ✓
        </button>
        <button
          onClick={() => setCompletion(habit.id, "skipped")}
          aria-label={isSkipped ? "unmark skipped" : "mark skipped"}
          title="skip"
          className={`btn btn-ghost text-xs px-3 py-1 ${
            isSkipped ? "text-text-muted border border-border" : ""
          }`}
        >
          —
        </button>
      </div>
    </div>
  );
}
