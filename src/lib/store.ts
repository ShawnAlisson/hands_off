import type { CivilizationState } from "./types";
import { createInitialState, syncAgentRoster } from "./civilization";
import { getOrCreateState, resetDatabase, saveState } from "./db";

let state: CivilizationState | null = null;
let initPromise: Promise<CivilizationState> | null = null;

async function initialize(): Promise<CivilizationState> {
  try {
    const s = await getOrCreateState();
    state = s;
    return s;
  } catch (err) {
    console.error("[Store] init failed, using in-memory fallback:", err);
    state = createInitialState();
    initPromise = null;
    return state;
  }
}

export async function ensureState(): Promise<CivilizationState> {
  if (state) return state;
  if (!initPromise) {
    initPromise = initialize();
  }
  try {
    return await initPromise;
  } catch (err) {
    initPromise = null;
    console.error("[Store] ensureState error:", err);
    state = state ?? createInitialState();
    return state;
  }
}

export function getStateSync(): CivilizationState | null {
  return state;
}

export async function getState(): Promise<CivilizationState> {
  const s = await ensureState();
  syncAgentRoster(s);
  return s;
}

export async function setState(newState: CivilizationState): Promise<void> {
  state = newState;
  try {
    await saveState(newState);
  } catch (err) {
    console.error("[Store] save failed:", err);
  }
}

export async function resetState(): Promise<CivilizationState> {
  try {
    await resetDatabase();
  } catch (err) {
    console.error("[Store] reset DB failed:", err);
  }
  state = createInitialState();
  syncAgentRoster(state);
  initPromise = Promise.resolve(state);
  try {
    await saveState(state);
  } catch (err) {
    console.error("[Store] save after reset failed:", err);
  }
  return state;
}
