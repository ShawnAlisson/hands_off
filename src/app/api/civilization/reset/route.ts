import { NextResponse } from "next/server";
import { resetState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const state = await resetState();
  return NextResponse.json(state);
}
