import { useState, useEffect, useRef } from "react";

interface Props {
  initialName?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function HabitForm({ initialName = "", onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        className="input flex-1"
        placeholder="habit name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />
      <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
        {initialName ? "save" : "add"}
      </button>
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        cancel
      </button>
    </form>
  );
}
