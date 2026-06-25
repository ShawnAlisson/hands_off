import { NextResponse } from "next/server";
import { getState, setState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await getState();
  state.running = false;
  await setState(state);
  return NextResponse.json(state);
}
