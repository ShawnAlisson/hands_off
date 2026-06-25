"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CivilizationState, SystemStatus } from "@/lib/types";
import { StoryFeed } from "./StoryFeed";
import { MetricsPanel, TeamPanel } from "./MetricsPanel";
import { SystemStatusBar } from "./SystemStatus";

// Slow ticks — one story step per interval (demo-friendly)
const TICK_MS = 18000;
const TICK_MS_MANUS = 28000;

export default function Dashboard() {
  const [state, setState] = useState<CivilizationState | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ticking, setTicking] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickingRef = useRef(false);

  const fetchState = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch("/api/civilization/state", { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (!data?.agents) throw new Error("Invalid state");
      setState(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    const res = await fetch("/api/health");
    setSystemStatus(await res.json());
  }, []);

  const start = async () => {
    const res = await fetch("/api/civilization/start", { method: "POST" });
    setState(await res.json());
    // First story beat after a short pause so the UI feels alive
    setTimeout(() => runTick(), 2500);
  };

  const stop = async () => {
    if (tickRef.current) clearInterval(tickRef.current);
    const res = await fetch("/api/civilization/stop", { method: "POST" });
    setState(await res.json());
  };

  const reset = async () => {
    if (tickRef.current) clearInterval(tickRef.current);
    const res = await fetch("/api/civilization/reset", { method: "POST" });
    setState(await res.json());
  };

  const runTick = useCallback(async () => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    setTicking(true);
    try {
      const res = await fetch("/api/civilization/tick", { method: "POST" });
      if (res.ok) setState(await res.json());
    } finally {
      tickingRef.current = false;
      setTicking(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    fetchHealth();
  }, [fetchState, fetchHealth]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (state?.running) {
      const ms = systemStatus?.manus ? TICK_MS_MANUS : TICK_MS;
      tickRef.current = setInterval(runTick, ms);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state?.running, systemStatus?.manus, runTick]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (loadError || !state) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg)] p-6">
        <div className="text-center">
          <p className="font-medium text-[var(--danger)]">Could not load</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{loadError}</p>
          <button onClick={() => { setLoading(true); fetchState(); }} className="mt-4 text-sm text-[var(--accent)]">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isIdle = !state.running && state.tick === 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--bg)]">
      {/* Top bar */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Hands Off</h1>
            <p className="text-xs text-[var(--muted)]">The company runs itself. You watch.</p>
          </div>
          <div className="flex items-center gap-3">
            <SystemStatusBar status={systemStatus} />
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                state.running ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${state.running ? "bg-[var(--success)]" : "bg-gray-300"}`} />
              {ticking ? "Working…" : state.running ? "Running" : "Paused"}
            </span>
            {!state.running ? (
              <button
                onClick={start}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Start
              </button>
            ) : (
              <button onClick={stop} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-2)]">
                Pause
              </button>
            )}
            <button onClick={reset} className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Full-height body */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 min-h-0">
        {isIdle && (
          <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-center sm:py-10">
            <h2 className="text-xl font-semibold sm:text-2xl">Press Start. Walk away.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
              Maya finds leads. James reaches out. Sam ships the fix. You read the story here — one step every ~20 seconds.
            </p>
            <button
              onClick={start}
              className="mt-5 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white"
            >
              Start company
            </button>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
          <aside className="flex shrink-0 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto scrollbar-thin">
            <MetricsPanel state={state} />
            <TeamPanel state={state} />
          </aside>
          <section className="flex min-h-[400px] flex-1 flex-col lg:min-h-0">
            <StoryFeed state={state} />
          </section>
        </div>
      </main>
    </div>
  );
}
