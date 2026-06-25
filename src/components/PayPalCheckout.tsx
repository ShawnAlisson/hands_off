"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCallback } from "react";

export function PayPalCheckout({
  dealId,
  onSuccess,
  onError,
}: {
  dealId: string;
  amount: number;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) return null;

  const createOrder = useCallback(async () => {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create order");
    return data.orderId as string;
  }, [dealId]);

  const onApprove = useCallback(
    async (data: { orderID: string }) => {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderID, dealId }),
      });
      const result = await res.json();
      if (!res.ok) {
        onError(result.error ?? "Payment failed");
        return;
      }
      onSuccess();
    },
    [dealId, onSuccess, onError]
  );

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "GBP",
        intent: "capture",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", label: "pay" }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => onError(String(err))}
      />
    </PayPalScriptProvider>
  );
}
