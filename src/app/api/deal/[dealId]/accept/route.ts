import { NextResponse } from "next/server";
import { acceptOwnerOffer, findDeal } from "@/lib/civilization";
import { getState, setState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const body = (await req.json().catch(() => ({}))) as { message?: string };

  const state = await getState();
  const deal = findDeal(state, dealId);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const result = acceptOwnerOffer(state, dealId, body.message);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await setState(state);

  return NextResponse.json({
    ok: true,
    deal: findDeal(state, dealId),
    message: "Payment received. Our team is building your fix now.",
  });
}
