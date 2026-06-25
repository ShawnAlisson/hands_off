const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function getPayPalClientId(): string | null {
  return process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? process.env.PAYPAL_CLIENT_ID ?? null;
}

export async function checkPayPalConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!isPayPalConfigured()) {
    return { ok: false, error: "PayPal credentials not set" };
  }
  try {
    await getAccessToken();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Auth failed" };
  }
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function createPayPalOrder(
  amountGbp: number,
  dealId: string,
  businessName: string
): Promise<{ orderId: string }> {
  const token = await getAccessToken();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: dealId,
          description: `Hands Off — fix for ${businessName}`,
          amount: {
            currency_code: "GBP",
            value: amountGbp.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${origin}/offer/${dealId}?paid=1`,
        cancel_url: `${origin}/offer/${dealId}?cancelled=1`,
        brand_name: "Hands Off",
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed: ${err}`);
  }

  const data = await res.json();
  return { orderId: data.id as string };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  captureId: string;
  status: string;
  amount: string;
}> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }

  const data = await res.json();
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    captureId: capture?.id ?? orderId,
    status: data.status,
    amount: capture?.amount?.value ?? "0",
  };
}
