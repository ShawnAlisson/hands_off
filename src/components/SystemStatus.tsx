"use client";

import type { SystemStatus } from "@/lib/types";

export function SystemStatusBar({ status }: { status: SystemStatus | null }) {
  if (!status) return null;

  const items = [
    { label: "Manus", on: status.manus },
    { label: "Supabase", on: status.supabaseConnected ?? false },
    { label: "Wassist", on: status.wassistConnected ?? false },
    { label: "PayPal", on: status.paypalConnected ?? false },
  ];

  return (
    <div className="hidden md:flex items-center gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={`text-[10px] font-medium ${item.on ? "text-[var(--success)]" : "text-[var(--muted)]"}`}
          title={item.on ? `${item.label} connected` : `${item.label} not connected`}
        >
          {item.label} {item.on ? "●" : "○"}
        </span>
      ))}
    </div>
  );
}
