"use client";

import type { CivilizationState } from "@/lib/types";
import { phaseLabel } from "@/lib/civilization";

const PIPELINE: { phase: string; key: string }[] = [
  { phase: "discovered", key: "Lead" },
  { phase: "researched", key: "Research" },
  { phase: "awaiting_owner", key: "Offer" },
  { phase: "paid", key: "Paid" },
  { phase: "building", key: "Build" },
  { phase: "delivered", key: "Done" },
];

export function MetricsPanel({ state }: { state: CivilizationState }) {
  const won = state.deals.length;
  const inProgress = state.activeDeal ? 1 : 0;
  const history = state.revenueHistory ?? [];
  const maxRev = Math.max(...history.map((h) => h.revenue), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Revenue" value={`£${state.totalRevenue}`} highlight />
        <Metric label="Deals won" value={String(won)} />
        <Metric label="In progress" value={String(inProgress)} />
        <Metric label="Budget" value={`£${state.companyBudget}`} />
      </div>

      {state.activeDeal && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Current deal</p>
          <p className="mt-1 text-sm font-semibold">{state.activeDeal.businessName}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{state.activeDeal.problem}</p>
          <div className="mt-4 flex flex-wrap gap-1">
            {PIPELINE.map((step, i) => {
              const phase = state.activeDeal!.phase;
              const phaseRank: Record<string, number> = {
                discovered: 0,
                researched: 1,
                awaiting_owner: 2,
                responded: 2,
                outreach: 2,
                paid: 3,
                building: 4,
                delivered: 5,
              };
              const currentIdx = phaseRank[phase] ?? 0;
              const done = i <= currentIdx;
              return (
                <span
                  key={step.phase}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    done
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-[var(--surface-2)] text-[var(--muted)]"
                  }`}
                >
                  {step.key}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[var(--accent)]">
            {phaseLabel(state.activeDeal.phase)}
          </p>
        </div>
      )}

      {history.length > 1 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Revenue over time</p>
          <div className="mt-3 flex h-16 items-end gap-1">
            {history.slice(-12).map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[var(--accent)]/80 min-w-[4px]"
                style={{ height: `${Math.max(8, (h.revenue / maxRev) * 100)}%` }}
                title={`£${h.revenue}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <p className="text-[11px] font-medium text-[var(--muted)]">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${highlight ? "text-[var(--accent)]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export function TeamPanel({ state }: { state: CivilizationState }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs font-medium text-[var(--muted)]">Your team</p>
      <ul className="mt-3 space-y-3">
        {state.agents.map((agent) => (
          <li key={agent.id} className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{agent.name}</p>
              <p className="text-xs text-[var(--muted)]">{agent.title}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-mono text-[var(--accent)]">{agent.reputation}</p>
              <p className="text-[10px] text-[var(--muted)]">rep</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
