import { NextResponse } from "next/server";
import { isManusEnabled } from "@/lib/manus";
import { checkSupabaseConnection, isSupabaseConfigured } from "@/lib/db";
import { checkPayPalConnection, isPayPalConfigured } from "@/lib/paypal";
import { checkWassistConnection, isWassistConfigured } from "@/lib/wassist";

export const dynamic = "force-dynamic";

export async function GET() {
  let supabaseConnected = false;
  let supabaseError: string | null = null;

  if (isSupabaseConfigured()) {
    const result = await checkSupabaseConnection();
    supabaseConnected = result.ok;
    supabaseError = result.error;
  }

  const wassistCheck = isWassistConfigured() ? await checkWassistConnection() : { ok: false, agentCount: 0 };
  const paypalCheck = isPayPalConfigured() ? await checkPayPalConnection() : { ok: false };

  return NextResponse.json({
    manus: isManusEnabled(),
    supabase: isSupabaseConfigured(),
    supabaseConnected,
    supabaseError,
    supabaseRealtime: isSupabaseConfigured(),
    wassist: isWassistConfigured(),
    wassistConnected: wassistCheck.ok,
    wassistAgents: wassistCheck.agentCount,
    wassistError: wassistCheck.error ?? null,
    paypal: isPayPalConfigured(),
    paypalConnected: paypalCheck.ok,
    paypalError: paypalCheck.error ?? null,
    paypalMode: process.env.PAYPAL_MODE ?? "sandbox",
  });
}
