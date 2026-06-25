import { NextResponse } from "next/server";
import { runTick } from "@/lib/civilization";
import { getState, setState } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const state = await getState();
  if (!state.running) {
    return NextResponse.json({ error: "Civilization not running" }, { status: 400 });
  }

  const newState = await runTick(structuredClone(state));
  await setState(newState);

  return NextResponse.json(newState);
}
