interface Props {
  current: number;
  longest: number;
}

export function StreakBadge({ current, longest }: Props) {
  return (
    <div className="flex gap-4">
      <div className="card text-center min-w-20">
        <div
          className={`text-2xl font-semibold tabular-nums ${current > 0 ? "text-success" : "text-text-faint"}`}
        >
          {current}
        </div>
        <div className="text-xs text-text-muted mt-1">current streak</div>
      </div>
      <div className="card text-center min-w-20">
        <div className="text-2xl font-semibold tabular-nums text-text-secondary">
          {longest}
        </div>
        <div className="text-xs text-text-muted mt-1">longest streak</div>
      </div>
    </div>
  );
}
