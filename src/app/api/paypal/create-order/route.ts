import { NextResponse } from "next/server";
import { findDeal } from "@/lib/civilization";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import { getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { dealId } = (await req.json()) as { dealId?: string };

  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: "PayPal not configured" }, { status: 503 });
  }

  const state = await getState();
  const deal = findDeal(state, dealId);
  if (!deal || deal.phase !== "awaiting_owner") {
    return NextResponse.json({ error: "Deal not available" }, { status: 400 });
  }

  const { orderId } = await createPayPalOrder(deal.value, dealId, deal.businessName);
  return NextResponse.json({ orderId });
}
