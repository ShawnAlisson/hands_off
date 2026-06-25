import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await getState();
  state.running = true;

  if (state.tick === 0 && state.events.length === 0) {
    state.events.unshift({
      id: `evt-start-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "company_started",
      title: "Company is live",
      body: "Five specialists are on the clock. Leads will appear here one step at a time — problem, solution, outreach, payment, delivery.",
    });
  }

  await setState(state);
  return NextResponse.json(state);
}
