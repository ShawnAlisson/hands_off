"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BusinessSitePreview } from "@/components/BusinessSitePreview";
import { PayPalCheckout } from "@/components/PayPalCheckout";
import type { Deal } from "@/lib/types";

export default function OfferPage({ params }: { params: Promise<{ dealId: string }> }) {
  const [dealId, setDealId] = useState<string | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [salesAgent, setSalesAgent] = useState<{ name: string; title: string } | null>(null);
  const [canAccept, setCanAccept] = useState(false);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<Deal["chatLog"]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [lastReplyManus, setLastReplyManus] = useState(false);

  useEffect(() => {
    params.then((p) => setDealId(p.dealId));
  }, [params]);

  useEffect(() => {
    if (!dealId) return;
    fetch(`/api/deal/${dealId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.deal) {
          setDeal(data.deal);
          setSalesAgent(data.salesAgent);
          setCanAccept(data.canAccept);
          setPaypalEnabled(!!data.paypalEnabled);
          setChatLog(data.deal.chatLog ?? []);
          setPaid(!data.canAccept && data.deal.phase !== "awaiting_owner");
        }
        setLoading(false);
      });
  }, [dealId]);

  const sendChat = async () => {
    if (!dealId || !chatInput.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/deal/${dealId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatInput.trim() }),
    });
    const data = await res.json();
    if (data.chatLog) setChatLog(data.chatLog);
    if (data.manus) setLastReplyManus(true);
    setChatInput("");
    setSending(false);
  };

  const onPaymentSuccess = async () => {
    setPayError(null);
    const res = await fetch(`/api/deal/${dealId}`);
    const data = await res.json();
    if (data.deal) {
      setDeal(data.deal);
      setPaid(true);
      setCanAccept(false);
    }
  };

  const acceptWithoutPayPal = async () => {
    if (!dealId) return;
    setPayError(null);
    const res = await fetch(`/api/deal/${dealId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Accepted — please proceed." }),
    });
    const data = await res.json();
    if (res.ok) {
      setPaid(true);
      setCanAccept(false);
      if (data.deal) setDeal(data.deal);
    } else {
      setPayError(data.error ?? "Could not accept offer");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-[var(--muted)]">Loading offer…</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-[var(--muted)]">Offer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-xs text-[var(--muted)]">Private offer · Hands Off</p>
            <h1 className="text-lg font-semibold">{deal.businessName}</h1>
          </div>
          <Link href="/" className="text-sm text-[var(--accent)]">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">Their website today</p>
          <BusinessSitePreview deal={deal} />
          <Link
            href={`/site/${dealId}`}
            className="mt-2 inline-block text-xs text-[var(--accent)]"
            target="_blank"
          >
            Open full preview →
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-[var(--muted)]">Outreach from {salesAgent?.name}</p>
              {deal.manusEnhanced && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                  Manus AI
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--muted)]">{salesAgent?.title}</p>
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-[var(--surface-2)] p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {deal.outreachMessage ?? "Loading message…"}
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">Proposed fix: {deal.solution}</p>
            <p className="mt-1 text-lg font-semibold text-[var(--accent)]">£{deal.value}</p>
          </div>

          <div className="flex flex-1 flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 min-h-[200px]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--muted)]">
                Chat with {salesAgent?.name ?? "James"}
              </p>
              {lastReplyManus && (
                <span className="text-[10px] text-violet-600">Powered by Manus AI</span>
              )}
            </div>
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto max-h-48 scrollbar-thin">
              {chatLog?.length === 0 && (
                <p className="text-sm text-[var(--muted)]">
                  Ask about timeline, price, or what changes on your site.
                </p>
              )}
              {chatLog?.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.role === "owner"
                      ? "ml-6 bg-[var(--accent-soft)] text-[var(--text)]"
                      : "mr-6 bg-[var(--surface-2)]"
                  }`}
                >
                  <p className="text-[10px] font-medium text-[var(--muted)] mb-0.5">
                    {m.role === "owner" ? "You" : salesAgent?.name}
                  </p>
                  {m.text}
                </div>
              ))}
            </div>
            {canAccept && (
              <div className="mt-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Type a question…"
                  className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  disabled={sending}
                />
                <button
                  onClick={sendChat}
                  disabled={sending}
                  className="rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {sending ? "…" : "Send"}
                </button>
              </div>
            )}
          </div>

          {canAccept && paypalEnabled && dealId && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="mb-3 text-xs font-medium text-[var(--muted)]">
                Pay with PayPal Sandbox · £{deal.value}
              </p>
              <PayPalCheckout
                dealId={dealId}
                amount={deal.value}
                onSuccess={onPaymentSuccess}
                onError={(msg) => setPayError(msg)}
              />
            </div>
          )}

          {canAccept && !paypalEnabled && (
            <button
              onClick={acceptWithoutPayPal}
              className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Accept offer · £{deal.value} (demo — no PayPal)
            </button>
          )}

          {payError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {payError}
            </p>
          )}

          {paid && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="font-medium text-green-800">Payment received</p>
              <p className="mt-1 text-sm text-green-700">
                Sam is building your fix with Manus AI. Watch the dashboard — the site preview updates when it&apos;s live.
              </p>
              <Link href={`/site/${dealId}`} className="mt-2 inline-block text-sm text-green-800 underline">
                View website
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
