"use client";

import Link from "next/link";
import type { CivilizationState, CivilizationEvent } from "@/lib/types";
import { phaseLabel } from "@/lib/civilization";

const TYPE_STYLES: Record<string, { dot: string; label: string }> = {
  company_started: { dot: "bg-blue-500", label: "Start" },
  lead_discovered: { dot: "bg-violet-500", label: "Lead" },
  problem_analyzed: { dot: "bg-amber-500", label: "Problem" },
  solution_proposed: { dot: "bg-sky-500", label: "Solution" },
  outreach_sent: { dot: "bg-indigo-500", label: "Outreach" },
  owner_responded: { dot: "bg-teal-500", label: "Reply" },
  payment_received: { dot: "bg-emerald-500", label: "Payment" },
  build_started: { dot: "bg-orange-500", label: "Build" },
  build_shipped: { dot: "bg-emerald-600", label: "Shipped" },
  deal_won: { dot: "bg-green-600", label: "Won" },
  revenue_earned: { dot: "bg-green-500", label: "Revenue" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function EventCard({ event, isNew }: { event: CivilizationEvent; isNew: boolean }) {
  const style = TYPE_STYLES[event.type] ?? { dot: "bg-gray-400", label: event.type };
  const isOutreach = event.type === "outreach_sent";
  const offerLink = event.meta?.offer;
  const siteLink = event.meta?.website;

  return (
    <article
      className={`relative border-l-2 border-[var(--border)] pl-5 pb-8 last:pb-0 ${isNew ? "animate-fade-up" : ""}`}
    >
      <span className={`absolute -left-[5px] top-1.5 h-2 w-2 rounded-full ${style.dot}`} />
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <time className="font-mono">{formatTime(event.timestamp)}</time>
        <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 font-medium text-[var(--text)]">
          {style.label}
        </span>
        {event.phase && <span>{phaseLabel(event.phase)}</span>}
      </div>
      <h3 className="mt-1.5 text-sm font-semibold">{event.title}</h3>
      {(event.agentName || event.businessName) && (
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          {event.agentName}
          {event.agentTitle && ` · ${event.agentTitle}`}
          {event.businessName && ` — ${event.businessName}`}
        </p>
      )}

      {isOutreach ? (
        <details className="mt-3 group" open>
          <summary className="cursor-pointer text-sm font-medium text-[var(--accent)]">
            Read full outreach message
          </summary>
          <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {event.body}
          </div>
        </details>
      ) : (
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{event.body}</p>
      )}

      {(offerLink || siteLink || event.dealId) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(offerLink || event.dealId) && (
            <Link
              href={offerLink ?? `/offer/${event.dealId}`}
              target="_blank"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Open offer portal →
            </Link>
          )}
          {(siteLink || event.dealId) && (
            <Link
              href={siteLink ?? `/site/${event.dealId}`}
              target="_blank"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-2)]"
            >
              View their website
            </Link>
          )}
        </div>
      )}

      {event.meta && (
        <dl className="mt-3 flex flex-wrap gap-2">
          {Object.entries(event.meta)
            .filter(([k]) => !["offer", "website"].includes(k))
            .map(([k, v]) => (
              <div
                key={k}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs"
              >
                <span className="text-[var(--muted)] capitalize">{k}: </span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
        </dl>
      )}
    </article>
  );
}

export function StoryFeed({ state }: { state: CivilizationState }) {
  const waiting = state.activeDeal?.phase === "awaiting_owner";

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-sm font-semibold">Live activity</h2>
        <p className="text-xs text-[var(--muted)]">What the company is doing right now</p>
        {waiting && state.activeDeal && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Waiting for {state.activeDeal.businessName} to accept on the{" "}
            <Link href={`/offer/${state.activeDeal.id}`} className="font-semibold underline" target="_blank">
              offer portal
            </Link>
            . Pipeline pauses until they pay.
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 min-h-[280px]">
        {state.events.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--muted)]">Press Start to begin.</p>
        ) : (
          state.events.map((event, i) => <EventCard key={event.id} event={event} isNew={i === 0} />)
        )}
      </div>
    </div>
  );
}
