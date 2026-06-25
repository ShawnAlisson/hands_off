import { NextResponse } from "next/server";
import { sendWassistOutreach, checkWassistConnection, listWassistAgents } from "@/lib/wassist";

export const dynamic = "force-dynamic";

/** POST /api/wassist/test — send a test WhatsApp to WASSIST_DEMO_PHONE */
export async function POST() {
  const check = await checkWassistConnection();
  const agents = await listWassistAgents();
  const phone = process.env.WASSIST_DEMO_PHONE;

  if (!phone) {
    return NextResponse.json({
      ok: false,
      error: "Set WASSIST_DEMO_PHONE=+44... in .env",
      agents,
      check,
    });
  }

  const result = await sendWassistOutreach({
    businessName: "Test Business",
    message: "Hi — this is a test outreach from Hands Off. If you see this, Wassist WhatsApp is working!",
    offerUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/`,
  });

  return NextResponse.json({ ok: result.sent, ...result, agents, check });
}

export async function GET() {
  const check = await checkWassistConnection();
  const agents = await listWassistAgents();
  return NextResponse.json({ check, agents, phone: process.env.WASSIST_DEMO_PHONE ? "set" : "missing" });
}
