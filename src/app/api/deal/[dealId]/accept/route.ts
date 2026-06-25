import { NextResponse } from "next/server";
import { acceptOwnerOffer, findDeal } from "@/lib/civilization";
import { getState, setState } from "@/lib/store";
import { isPayPalConfigured } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/** Fallback accept when PayPal sandbox not configured (dev only). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  if (isPayPalConfigured()) {
    return NextResponse.json(
      { error: "Use PayPal checkout — POST /api/paypal/capture-order" },
      { status: 400 }
    );
  }

  const { dealId } = await params;
  const body = (await req.json().catch(() => ({}))) as { message?: string };
  const state = await getState();

  const result = acceptOwnerOffer(state, dealId, { lastOwnerMessage: body.message });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await setState(state);
  return NextResponse.json({ ok: true, deal: findDeal(state, dealId), simulated: true });
}
