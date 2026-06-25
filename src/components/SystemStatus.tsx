"use client";

import type { SystemStatus } from "@/lib/types";

export function SystemStatusBar({ status }: { status: SystemStatus | null }) {
  if (!status) return null;

  const items = [
    { label: "Manus", on: status.manus },
    { label: "Supabase", on: status.supabaseConnected ?? false },
  ];

  return (
    <div className="hidden md:flex items-center gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={`text-[10px] font-medium ${item.on ? "text-[var(--success)]" : "text-[var(--muted)]"}`}
        >
          {item.label} {item.on ? "●" : "○"}
        </span>
      ))}
    </div>
  );
}
