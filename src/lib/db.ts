import type { CivilizationState } from "./types";
import { getSupabaseServer, isSupabaseConfigured } from "./supabase";
import { createInitialState, syncAgentRoster } from "./civilization";
import path from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";

export { isSupabaseConfigured };

const BUCKET = "hands-off";
const STATE_PATH = "civilization/state.json";
const LOCAL_STATE_DIR = path.join(process.cwd(), ".data");
const LOCAL_STATE_FILE = path.join(LOCAL_STATE_DIR, "state.json");
const TIMEOUT_MS = 8000;

let storageReady = false;

function normalizeState(raw: CivilizationState): CivilizationState | null {
  if (!raw?.agents?.length) return null;
  const normalized: CivilizationState = {
    ...createInitialState(),
    ...raw,
    activeDeal: raw.activeDeal ?? null,
    deals: raw.deals ?? [],
    revenueHistory: raw.revenueHistory ?? [{ tick: 0, revenue: raw.totalRevenue ?? 0, at: new Date().toISOString() }],
    agents: raw.agents.map((a) => ({
      ...a,
      title: a.title ?? a.role ?? "Team member",
    })),
    events: (raw.events ?? []).map((e) => ({
      ...e,
      title: e.title ?? e.type,
      body: e.body ?? (e as { description?: string }).description ?? "",
    })),
  };
  syncAgentRoster(normalized);
  return normalized;
}

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function ensureStorageBucket(): Promise<boolean> {
  const db = getSupabaseServer();
  if (!db || storageReady) return storageReady;

  try {
    const { data: buckets, error: listErr } = await db.storage.listBuckets();
    if (listErr) {
      console.error("[DB] listBuckets:", listErr.message);
      return false;
    }

    const exists = buckets?.some((b) => b.name === BUCKET);
    if (!exists) {
      const { error: createErr } = await db.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 1024 * 1024,
      });
      if (createErr && !createErr.message.includes("already exists")) {
        console.error("[DB] createBucket:", createErr.message);
        return false;
      }
    }

    storageReady = true;
    return true;
  } catch (err) {
    console.error("[DB] ensureStorageBucket:", err);
    return false;
  }
}

function loadLocalState(): CivilizationState | null {
  try {
    if (!existsSync(LOCAL_STATE_FILE)) return null;
    const raw = readFileSync(LOCAL_STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CivilizationState;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

function saveLocalState(state: CivilizationState): void {
  try {
    if (!existsSync(LOCAL_STATE_DIR)) mkdirSync(LOCAL_STATE_DIR, { recursive: true });
    writeFileSync(LOCAL_STATE_FILE, JSON.stringify(state), "utf-8");
  } catch (err) {
    console.error("[DB] local save failed:", err);
  }
}

function deleteLocalState(): void {
  try {
    if (existsSync(LOCAL_STATE_FILE)) unlinkSync(LOCAL_STATE_FILE);
  } catch {
    // ignore
  }
}

async function loadFromStorage(): Promise<CivilizationState | null> {
  const db = getSupabaseServer();
  if (!db) return null;

  const ready = await ensureStorageBucket();
  if (!ready) return null;

  try {
    const { data, error } = await withTimeout(
      db.storage.from(BUCKET).download(STATE_PATH)
    );

    if (error) {
      if (error.message?.includes("not found") || error.message?.includes("Object not found")) {
        return null;
      }
      console.error("[DB] storage download:", error.message);
      return null;
    }

    const text = await data.text();
    const parsed = JSON.parse(text) as CivilizationState;
    return normalizeState(parsed);
  } catch (err) {
    console.error("[DB] loadFromStorage:", err);
    return null;
  }
}

async function saveToStorage(state: CivilizationState): Promise<boolean> {
  const db = getSupabaseServer();
  if (!db) return false;

  const ready = await ensureStorageBucket();
  if (!ready) return false;

  try {
    const body = JSON.stringify(state);
    const { error } = await withTimeout(
      db.storage.from(BUCKET).upload(STATE_PATH, body, {
        upsert: true,
        contentType: "application/json",
      })
    );

    if (error) {
      console.error("[DB] storage upload:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[DB] saveToStorage:", err);
    return false;
  }
}

async function deleteFromStorage(): Promise<void> {
  const db = getSupabaseServer();
  if (!db) return;
  await ensureStorageBucket();
  await db.storage.from(BUCKET).remove([STATE_PATH]);
}

export async function loadState(): Promise<CivilizationState | null> {
  if (isSupabaseConfigured()) {
    const fromCloud = await loadFromStorage();
    if (fromCloud) return fromCloud;
  }
  return loadLocalState();
}

export async function saveState(state: CivilizationState): Promise<void> {
  saveLocalState(state);
  if (isSupabaseConfigured()) {
    await saveToStorage(state);
  }
}

export async function resetDatabase(): Promise<void> {
  deleteLocalState();
  if (isSupabaseConfigured()) {
    await deleteFromStorage();
  }
}

export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Not configured" };

  try {
    const ready = await ensureStorageBucket();
    return ready
      ? { ok: true, error: null }
      : { ok: false, error: "Could not init storage bucket" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export async function getOrCreateState(): Promise<CivilizationState> {
  try {
    const existing = await loadState();
    if (existing) return existing;
  } catch (err) {
    console.error("[DB] load failed:", err);
  }

  const fresh = createInitialState();
  await saveState(fresh);
  return fresh;
}
