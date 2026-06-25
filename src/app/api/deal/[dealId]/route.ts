import { NextResponse } from "next/server";
import { findDeal } from "@/lib/civilization";
import { getState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const state = await getState();
  const deal = findDeal(state, dealId);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const james = state.agents.find((a) => a.id === deal.salesLeadId);

  return NextResponse.json({
    deal,
    salesAgent: james ? { name: james.name, title: james.title } : null,
    canAccept: deal.phase === "awaiting_owner",
    siteFixed: deal.siteFixed ?? false,
  });
}
