"use client";

import { isSiteFixed, missingFeatureLabel, sectorAccent, siteVariantForProblem } from "@/lib/site-templates";
import type { Deal, SiteContent } from "@/lib/types";
import { SiteFixWidget, SiteShell } from "./site/SiteWidgets";

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
  const accent = sectorAccent(deal.sector);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg ${compact ? "" : "min-h-[520px]"}`}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-2">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 rounded-md bg-white px-3 py-1 text-[10px] text-gray-500 font-mono truncate">
          www.{deal.businessName.toLowerCase().replace(/\s+/g, "")}.co.uk
        </div>
        {fixed ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
            {content?.generatedByManus ? "Live · Manus AI" : "Live"}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            Missing: {missing}
          </span>
        )}
      </div>

      <SiteShell
        businessName={deal.businessName}
        city={deal.city}
        sector={deal.sector}
        accent={accent}
        navCta={fixed ? (content?.ctaText ?? "Book now") : undefined}
      >
        {fixed && content?.heroSubtitle && variant !== "website" && (
          <p className="mb-4 text-sm leading-relaxed text-gray-600">{content.heroSubtitle}</p>
        )}

        <SiteFixWidget variant={variant} fixed={fixed} businessName={deal.businessName} content={content} />

        {!fixed && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-900">Gap identified · Maya (Research)</p>
            <p className="mt-1 text-sm text-amber-800">{deal.problem}</p>
          </div>
        )}

        {fixed && content?.testimonial && (
          <blockquote className="mt-5 border-l-4 border-green-400 pl-4 text-sm italic text-gray-600">
            {content.testimonial}
          </blockquote>
        )}

        {fixed && (
          <div className="mt-4 flex flex-wrap gap-2">
            {["SSL secured", "Mobile friendly", "GDPR compliant"].map((badge) => (
              <span key={badge} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] text-gray-600">
                ✓ {badge}
              </span>
            ))}
          </div>
        )}
      </SiteShell>
    </div>
  );
}
