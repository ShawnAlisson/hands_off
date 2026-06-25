import { NextResponse } from "next/server";
import { acceptOwnerOffer, findDeal } from "@/lib/civilization";
import { capturePayPalOrder, isPayPalConfigured } from "@/lib/paypal";
import { getState, setState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { orderId, dealId, message } = (await req.json()) as {
    orderId?: string;
    dealId?: string;
    message?: string;
  };

  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }

  const state = await getState();
  const deal = findDeal(state, dealId);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  let captureId: string | undefined;
  let paypalOrderId: string | undefined;

  if (isPayPalConfigured()) {
    if (!orderId) {
      return NextResponse.json({ error: "PayPal payment required" }, { status: 400 });
    }
    try {
      const capture = await capturePayPalOrder(orderId);
      captureId = capture.captureId;
      paypalOrderId = orderId;
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "PayPal capture failed" },
        { status: 502 }
      );
    }
  }

  const lastOwnerMessage =
    message ??
    deal.chatLog?.filter((m) => m.role === "owner").at(-1)?.text ??
    `Accepted — let's fix ${deal.problem.toLowerCase()}. Happy to pay £${deal.value}.`;

  const result = acceptOwnerOffer(state, dealId, {
    lastOwnerMessage,
    paypalCaptureId: captureId,
    paypalOrderId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await setState(state);
  return NextResponse.json({ ok: true, deal: findDeal(state, dealId), captureId });
}
