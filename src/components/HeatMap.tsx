import { useRef, useEffect, useMemo } from "react";
import { buildHeatmapGrid } from "../lib/utils";
import { type Completion } from "../db";
import { format, parseISO } from "date-fns";

interface Props {
  completions: Completion[];
  weeksBack?: number;
}

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function HeatMap({ completions, weeksBack = 52 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const weeks = useMemo(
    () => buildHeatmapGrid(completions, weeksBack),
    [completions, weeksBack],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks.length]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1 items-start">
        <div className="flex flex-col gap-1 shrink-0 pt-px">
          {DAYS.map((d) => (
            <div
              key={d}
              className="h-3 flex items-center text-text-faint"
              style={{ fontSize: "0.6rem", width: "1.75rem" }}
            >
              {d}
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="overflow-x-auto">
          <div className="flex gap-1" style={{ width: "max-content" }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <Cell key={di} date={day.date} status={day.status} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 text-text-faint"
        style={{ fontSize: "0.7rem" }}
      >
        <span>less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface border border-border-subtle" />
          <div
            className="w-3 h-3 rounded-sm border border-border-subtle"
            style={{
              background:
                "color-mix(in srgb, var(--color-accent) 25%, var(--color-surface))",
            }}
          />
          <div
            className="w-3 h-3 rounded-sm border border-border-subtle"
            style={{
              background:
                "color-mix(in srgb, var(--color-accent) 60%, var(--color-surface))",
            }}
          />
          <div className="w-3 h-3 rounded-sm bg-accent" />
        </div>
        <span>more</span>
      </div>
    </div>
  );
}

function Cell({
  date,
  status,
}: {
  date: string;
  status: "done" | "skipped" | null;
}) {
  const label = `${format(parseISO(date), "MMM d")} — ${status ?? "no data"}`;

  let style: React.CSSProperties | undefined;
  let className = "w-3 h-3 rounded-sm ";

  if (status === "done") {
    className += "bg-accent";
  } else if (status === "skipped") {
    className += "border border-border-subtle";
    style = { background: "var(--color-border-subtle)" };
  } else {
    className += "bg-surface border border-border-subtle";
  }

  return (
    <div title={label} aria-label={label} className={className} style={style} />
  );
}
