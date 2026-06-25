import { NextResponse } from "next/server";
import { addChatMessage, findDeal } from "@/lib/civilization";
import { replyAsSalesAgent } from "@/lib/offer-chat";
import { getState, setState } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const { message } = (await req.json()) as { message?: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const state = await getState();
  const deal = findDeal(state, dealId);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.phase !== "awaiting_owner") {
    return NextResponse.json({ error: "Offer no longer open" }, { status: 400 });
  }

  const james = state.agents.find((a) => a.id === deal.salesLeadId);
  const agentName = james?.name ?? "James";
  const reply = await replyAsSalesAgent(deal, message.trim(), agentName);

  addChatMessage(state, dealId, message.trim(), reply);
  await setState(state);

  return NextResponse.json({ reply, chatLog: deal.chatLog });
}
