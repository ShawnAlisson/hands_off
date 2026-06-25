"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BusinessSitePreview } from "@/components/BusinessSitePreview";
import type { Deal } from "@/lib/types";

export default function SitePreviewPage({ params }: { params: Promise<{ dealId: string }> }) {
  const [dealId, setDealId] = useState<string | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    params.then((p) => setDealId(p.dealId));
  }, [params]);

  useEffect(() => {
    if (!dealId) return;
    const load = () =>
      fetch(`/api/deal/${dealId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.deal) setDeal(data.deal);
        });
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [dealId]);

  if (!deal) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading site preview…</p>
      </div>
    );
  }

  const fixed = deal.siteFixed ?? ["building", "delivered", "paid"].includes(deal.phase);

  return (
    <div className="min-h-[100dvh] bg-gray-100 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {fixed ? "Live site (after fix)" : "Current site (before fix)"} · {deal.businessName}
          </p>
          <Link href="/" className="text-sm text-blue-600">
            Dashboard
          </Link>
        </div>
        <BusinessSitePreview deal={{ ...deal, siteFixed: fixed }} />
        {!fixed && deal.phase === "awaiting_owner" && (
          <p className="mt-4 text-center text-sm text-gray-600">
            <Link href={`/offer/${dealId}`} className="text-blue-600 underline">
              Accept the offer
            </Link>{" "}
            to have our team fix this.
          </p>
        )}
      </div>
    </div>
  );
}
