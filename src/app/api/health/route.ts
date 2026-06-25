import { NextResponse } from "next/server";
import { isManusEnabled } from "@/lib/manus";
import { checkSupabaseConnection, isSupabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let supabaseConnected = false;
  let supabaseError: string | null = null;

  if (isSupabaseConfigured()) {
    const result = await checkSupabaseConnection();
    supabaseConnected = result.ok;
    supabaseError = result.error;
  }

  return NextResponse.json({
    manus: isManusEnabled(),
    supabase: isSupabaseConfigured(),
    supabaseConnected,
    supabaseError,
    supabaseRealtime: isSupabaseConfigured(),
  });
}
