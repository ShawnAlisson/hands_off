"use client";

import { isSiteFixed, missingFeatureLabel, siteVariantForProblem } from "@/lib/site-templates";
import type { Deal, SiteContent } from "@/lib/types";

export function BusinessSitePreview({
  deal,
  compact,
}: {
  deal: Pick<
    Deal,
    "businessName" | "problem" | "city" | "sector" | "phase" | "siteFixed" | "siteContent"
  >;
  compact?: boolean;
}) {
  const variant = siteVariantForProblem(deal.problem);
  const fixed = deal.siteFixed ?? isSiteFixed(deal.phase);
  const missing = missingFeatureLabel(variant);
  const content = deal.siteContent;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm ${compact ? "" : "min-h-[420px]"}`}
    >
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
            {content?.generatedByManus ? "Fixed · Manus AI" : "Fixed"}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Missing: {missing}
          </span>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {fixed && content ? (
          <FixedSiteContent content={content} businessName={deal.businessName} variant={variant} />
        ) : (
          <BrokenSiteContent deal={deal} variant={variant} missing={missing} />
        )}
      </div>
    </div>
  );
}

function BrokenSiteContent({
  deal,
  variant,
  missing,
}: {
  deal: Pick<Deal, "businessName" | "problem" | "city" | "sector">;
  variant: string;
  missing: string;
}) {
  return (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{deal.sector}</p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">{deal.businessName}</h1>
      <p className="mt-1 text-sm text-gray-500">{deal.city}</p>
      <p className="mt-6 text-sm text-gray-600">
        Welcome to {deal.businessName}. Professional {deal.sector.toLowerCase()} services.
      </p>
      <div className="mt-8">
        <SiteFeature variant={variant} fixed={false} />
      </div>
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">Gap identified (Maya · Research)</p>
        <p className="mt-1 text-sm text-amber-800">{deal.problem}</p>
      </div>
    </>
  );
}

function FixedSiteContent({
  content,
  businessName,
  variant,
}: {
  content: SiteContent;
  businessName: string;
  variant: string;
}) {
  return (
    <>
      <p className="text-xs font-medium text-green-600">✓ Live — rebuilt by Sam + Manus AI</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{content.heroTitle}</h1>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{content.heroSubtitle}</p>
      <button
        type="button"
        className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        {content.ctaText}
      </button>
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="text-sm font-semibold text-green-900">{content.featureTitle}</p>
        <p className="mt-2 text-sm text-green-800 leading-relaxed">{content.featureDescription}</p>
        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white"
        >
          {content.featureButtonText}
        </button>
      </div>
      {content.testimonial && (
        <blockquote className="mt-6 border-l-4 border-green-400 pl-4 text-sm italic text-gray-600">
          {content.testimonial}
        </blockquote>
      )}
      <SiteFeature variant={variant} fixed />
    </>
  );
}

function SiteFeature({ variant, fixed }: { variant: string; fixed: boolean }) {
  if (!fixed) {
    if (variant === "portal") {
      return (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center">
          <p className="text-sm text-amber-700">Client portal — not available</p>
          <p className="mt-1 text-xs text-amber-600">Clients must call for case updates</p>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center opacity-70">
        <p className="text-sm text-gray-500">Key feature missing from this site</p>
      </div>
    );
  }
  return null;
}
