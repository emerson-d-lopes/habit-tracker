import { ShoalSync, SyncKeys } from "shoal-client";
import { DexieShoalStorage } from "shoal-client/dexie";
import { db, type Completion, type Habit } from "../db";

/**
 * Optional sync against a self-hosted shoal server. Off until the user saves
 * a server URL and recovery phrase in the sync settings (Habits page). All
 * writes stay local-first: mutations append to an outbox inside the same
 * IndexedDB database, and syncNow() drains it opportunistically. A dead or
 * unconfigured server changes nothing about the app.
 */

const URL_KEY = "shoal-server-url";
const MNEMONIC_KEY = "shoal-mnemonic";
const NODE_KEY = "shoal-node-id";

type HabitBody = Habit & { deleted?: boolean };
type CompletionBody = Completion & { deleted?: boolean };

let instance: ShoalSync | null = null;
let instanceFor = "";

export function syncConfig() {
  return {
    serverUrl: localStorage.getItem(URL_KEY) ?? "",
    mnemonic: localStorage.getItem(MNEMONIC_KEY) ?? "",
  };
}

export function syncEnabled(): boolean {
  const { serverUrl, mnemonic } = syncConfig();
  return serverUrl !== "" && mnemonic !== "";
}

function getSync(): ShoalSync | null {
  if (!syncEnabled()) return null;
  const { serverUrl, mnemonic } = syncConfig();
  const key = serverUrl + "\n" + mnemonic;
  if (instance && instanceFor === key) return instance;
  let nodeId = Number(localStorage.getItem(NODE_KEY));
  if (!Number.isInteger(nodeId) || nodeId === 0) {
    nodeId = crypto.getRandomValues(new Uint32Array(1))[0];
    localStorage.setItem(NODE_KEY, String(nodeId));
  }
  instance = new ShoalSync({
    serverUrl,
    mnemonic,
    collection: "habit-tracker",
    nodeId,
    storage: new DexieShoalStorage(db),
    apply: applyRemote,
  });
  instanceFor = key;
  return instance;
}

async function applyRemote(recordId: string, body: unknown): Promise<void> {
  const [kind, id] = recordId.split("/");
  if (kind === "habit") {
    const habit = body as HabitBody;
    if (habit.deleted) {
      await db.habits.delete(id);
      await db.completions.where("habitId").equals(id).delete();
    } else {
      const { deleted: _deleted, ...row } = habit;
      await db.habits.put({ ...row, id });
    }
  } else if (kind === "completion") {
    const completion = body as CompletionBody;
    if (completion.deleted) {
      await db.completions.delete(id);
    } else {
      const { deleted: _deleted, ...row } = completion;
      await db.completions.put({ ...row, id });
    }
  }
}

// ---- hooks called by the mutation helpers ---------------------------------

export async function recordHabit(habit: Habit): Promise<void> {
  await getSync()?.record(`habit/${habit.id}`, habit);
  scheduleSync();
}

export async function recordHabitDeleted(id: string): Promise<void> {
  await getSync()?.record(`habit/${id}`, { deleted: true });
  scheduleSync();
}

export async function recordCompletion(completion: Completion): Promise<void> {
  await getSync()?.record(`completion/${completion.id}`, completion);
  scheduleSync();
}

export async function recordCompletionDeleted(id: string): Promise<void> {
  await getSync()?.record(`completion/${id}`, { deleted: true });
  scheduleSync();
}

// ---- lifecycle ------------------------------------------------------------

/** Enable sync. Empty phrase = create a new identity; returns the phrase to show once. */
export async function enableSync(serverUrl: string, phrase: string): Promise<string> {
  const mnemonic = phrase.trim() === "" ? SyncKeys.generateMnemonic() : phrase.trim();
  SyncKeys.fromMnemonic(mnemonic); // validate before persisting
  localStorage.setItem(URL_KEY, serverUrl.trim().replace(/\/$/, ""));
  localStorage.setItem(MNEMONIC_KEY, mnemonic);
  instance = null;
  await bootstrap();
  await syncNow();
  return mnemonic;
}

export function disableSync(): void {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(MNEMONIC_KEY);
  instance = null;
}

/** Snapshot all current data into the outbox (first enable, recovery). */
async function bootstrap(): Promise<void> {
  const sync = getSync();
  if (!sync) return;
  for (const habit of await db.habits.toArray()) {
    await sync.record(`habit/${habit.id}`, habit);
  }
  for (const completion of await db.completions.toArray()) {
    await sync.record(`completion/${completion.id}`, completion);
  }
}

export async function syncNow(): Promise<void> {
  const sync = getSync();
  if (!sync) return;
  await sync.sync();
  localStorage.setItem("shoal-last-sync", String(Date.now()));
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Debounced background sync after a burst of local writes. Failures are quiet; the outbox keeps everything. */
function scheduleSync(): void {
  clearTimeout(timer);
  timer = setTimeout(() => {
    void syncNow().catch(() => {});
  }, 5_000);
}

/** Call once at startup: sync on load and when the tab regains focus. */
export function startAutoSync(): void {
  if (!syncEnabled()) return;
  void syncNow().catch(() => {});
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow().catch(() => {});
  });
}

export function lastSyncAt(): number {
  return Number(localStorage.getItem("shoal-last-sync")) || 0;
}
