import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router";
import { db, type Habit } from "../db";
import { HabitForm } from "../components/HabitForm";
import {
  createHabit,
  updateHabit,
  archiveHabit,
  unarchiveHabit,
  deleteHabit,
} from "../hooks/useHabits";
import { seedSampleData } from "../lib/seed";

export function Habits() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const allHabits: Habit[] =
    useLiveQuery(() => db.habits.orderBy("order").toArray(), []) ?? [];

  const active = allHabits.filter((h) => !h.archivedAt);
  const archived = allHabits.filter((h) => h.archivedAt);

  async function handleCreate(name: string) {
    await createHabit(name);
    setShowForm(false);
  }

  async function handleUpdate(id: string, name: string) {
    await updateHabit(id, name);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-accent">habits</h1>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              className="btn btn-secondary text-sm"
              onClick={() => setShowForm(true)}
            >
              + new habit
            </button>
          )}
          <button
            className="btn btn-ghost text-xs text-text-faint"
            title="clear all data and load 4 sample habits with 90 days of history"
            onClick={async () => {
              if (confirm("replace all data with sample habits?")) {
                await seedSampleData();
              }
            }}
          >
            load sample data
          </button>
        </div>
      </div>

      {showForm && (
        <HabitForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {active.length === 0 && !showForm ? (
        <div className="card text-center py-12">
          <p className="text-text-muted text-sm">no habits yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((habit) =>
            editingId === habit.id ? (
              <HabitForm
                key={habit.id}
                initialName={habit.name}
                onSubmit={(name) => handleUpdate(habit.id, name)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={habit.id}
                className="card flex items-center justify-between gap-4"
              >
                <Link
                  to={`/habits/${habit.id}`}
                  className="flex-1 min-w-0 text-sm font-medium text-text hover:text-accent transition-colors truncate"
                >
                  {habit.name}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => setEditingId(habit.id)}
                  >
                    edit
                  </button>
                  <button
                    className="btn btn-ghost text-xs"
                    onClick={() => archiveHabit(habit.id)}
                  >
                    archive
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {archived.length > 0 && (
        <div className="space-y-2">
          <button
            className="text-sm text-text-muted hover:text-text transition-colors"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "▾" : "▸"} archived ({archived.length})
          </button>
          {showArchived && (
            <div className="space-y-2">
              {archived.map((habit) => (
                <div
                  key={habit.id}
                  className="card flex items-center justify-between gap-4 opacity-50"
                >
                  <span className="flex-1 min-w-0 text-sm text-text-secondary truncate">
                    {habit.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="btn btn-ghost text-xs"
                      onClick={() => unarchiveHabit(habit.id)}
                    >
                      restore
                    </button>
                    <button
                      className="btn btn-danger text-xs"
                      onClick={() => deleteHabit(habit.id)}
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
