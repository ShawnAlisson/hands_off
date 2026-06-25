"use client";

import { isSiteFixed, missingFeatureLabel, siteVariantForProblem } from "@/lib/site-templates";
import type { Deal } from "@/lib/types";

export function BusinessSitePreview({
  deal,
  compact,
}: {
  deal: Pick<Deal, "businessName" | "problem" | "city" | "sector" | "phase" | "siteFixed">;
  compact?: boolean;
}) {
  const variant = siteVariantForProblem(deal.problem);
  const fixed = deal.siteFixed ?? isSiteFixed(deal.phase);
  const missing = missingFeatureLabel(variant);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm ${compact ? "" : "min-h-[420px]"}`}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 rounded-md bg-white px-3 py-1 text-[10px] text-gray-500 font-mono truncate">
          {deal.businessName.toLowerCase().replace(/\s+/g, "")}.co.uk
        </div>
        {fixed ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
            Fixed
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Missing: {missing}
          </span>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{deal.sector}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{deal.businessName}</h1>
        <p className="mt-1 text-sm text-gray-500">{deal.city} · Est. 2012</p>

        <p className="mt-6 max-w-md text-sm leading-relaxed text-gray-600">
          Welcome to {deal.businessName}. We serve customers across {deal.city} with professional{" "}
          {deal.sector.toLowerCase()} services.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <SiteFeature variant={variant} fixed={fixed} />
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Contact</p>
            <p className="mt-2 text-sm text-gray-700">hello@{slug(deal.businessName)}.co.uk</p>
            <p className="text-sm text-gray-700">01onal 234 5678</p>
          </div>
        </div>

        {!fixed && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Problem spotted by Maya (Research)</p>
            <p className="mt-1 text-sm text-amber-800">{deal.problem}</p>
          </div>
        )}

        {fixed && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900">Shipped by Sam (Delivery Engineer)</p>
            <p className="mt-1 text-sm text-green-800">
              {missing} is now live on this site. Customers can use it today.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function SiteFeature({ variant, fixed }: { variant: string; fixed: boolean }) {
  if (variant === "booking") {
    return fixed ? (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <p className="text-xs font-medium text-green-800">Online booking</p>
        <button type="button" className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white">
          Book appointment
        </button>
        <p className="mt-2 text-xs text-green-700">Mon–Fri · Instant confirmation</p>
      </div>
    ) : (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60">
        <p className="text-xs font-medium text-gray-400 line-through">Online booking</p>
        <p className="mt-2 text-sm text-gray-400">Call us to schedule — no online slots</p>
      </div>
    );
  }

  if (variant === "portal") {
    return fixed ? (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <p className="text-xs font-medium text-green-800">Client portal</p>
        <button type="button" className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white">
          Client login
        </button>
        <p className="mt-2 text-xs text-green-700">Secure docs & case status</p>
      </div>
    ) : (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
        <p className="text-xs font-medium text-amber-800">Client portal</p>
        <p className="mt-2 text-sm text-amber-700">Not available — clients call for updates</p>
      </div>
    );
  }

  if (variant === "payments") {
    return fixed ? (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <p className="text-xs font-medium text-green-800">Pay online</p>
        <button type="button" className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white">
          Pay with card
        </button>
      </div>
    ) : (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs text-gray-400">Cash or invoice only — no card payments</p>
      </div>
    );
  }

  if (fixed) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <p className="text-xs font-medium text-green-800">Solution live</p>
        <p className="mt-2 text-sm text-green-700">Digital fix deployed</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
      <p className="text-xs font-medium text-amber-800">Gap identified</p>
      <p className="mt-2 text-sm text-amber-700">Key feature missing from site</p>
    </div>
  );
}
